
import { supabase } from "./supabaseClient.js";

// --------------------------------------------------
// FoodBridge account service — Supabase Auth
// Authentication uses Supabase.
// Profiles are stored in the public.profiles table.
// --------------------------------------------------

export const ACCOUNTS_STORAGE_KEY = "foodbridge_accounts_v2";

export const DASHBOARD_BY_ROLE = {
  donor: "/donor",
  ngo: "/ngo",
  receiver: "/receiver",
};

// Compatibility export for older components.
// Supabase is now the account source of truth.
export const accounts = [];

let currentSession = null;
const accountListeners = new Set();

function notifyAccountListeners() {
  accountListeners.forEach((callback) => callback());
}

export function onAccountsChanged(callback) {
  accountListeners.add(callback);
  return () => accountListeners.delete(callback);
}

function getUserMetadata(user) {
  return user?.user_metadata ?? {};
}

// Convert a Supabase user and profile into the account
// object expected by the existing FoodBridge components.
function makeAccount(user, profile = {}) {
  if (!user) return null;

  const metadata = getUserMetadata(user);
  const role = profile.role ?? metadata.role ?? null;

  return {
    id: user.id,
    role,
    name:
      profile.name ??
      metadata.name ??
      metadata.ngoName ??
      user.email ??
      "",
    email: profile.email ?? user.email ?? "",
    phone: profile.phone ?? metadata.phone ?? "",
    location: profile.location ?? metadata.location ?? "",
    createdAt: profile.created_at ?? user.created_at ?? "",
    verified: Boolean(user.email_confirmed_at),

    // These fields are kept for compatibility with the
    // existing NGO and receiver screens.
    ngoDetails:
      role === "ngo"
        ? {
            contactPerson: metadata.contactPerson ?? "",
            address: metadata.address ?? "",
            registrationNumber: metadata.registrationNumber ?? "",
          }
        : undefined,

    // Approval is not stored in the known profiles columns.
    // Do not treat a new NGO as approved automatically.
    ngoStatus:
      role === "ngo"
        ? metadata.ngoStatus ?? "Pending"
        : undefined,
  };
}

// Load the profile belonging to a Supabase Auth user.
async function loadProfile(user) {
  if (!user) {
    return { success: false, account: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, name, phone, location, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load FoodBridge profile:", error.message);

    return {
      success: false,
      reason: error.message,
      account: makeAccount(user),
    };
  }

  // If the profile has not been created yet, create it after
  // successful authentication. This requires suitable RLS
  // policies on the profiles table.
  if (!data) {
    const metadata = getUserMetadata(user);

    const newProfile = {
      id: user.id,
      email: user.email,
      role: metadata.role ?? null,
      name: metadata.name ?? metadata.ngoName ?? "",
      phone: metadata.phone ?? "",
      location: metadata.location ?? "",
    };

    const { data: insertedProfile, error: insertError } =
      await supabase
        .from("profiles")
       .upsert(newProfile, { onConflict: "id" })
        .select("id, email, role, name, phone, location, created_at")
        .single();

    if (insertError) {
      console.error(
        "Could not create FoodBridge profile:",
        insertError.message
      );

      return {
        success: false,
        reason: insertError.message,
        account: makeAccount(user),
      };
    }

    return {
      success: true,
      account: makeAccount(user, insertedProfile),
    };
  }

  return {
    success: true,
    account: makeAccount(user, data),
  };
}

// Refresh the account after Supabase authentication changes.
async function refreshCurrentAccount(user) {
  if (!user) {
    currentSession = null;
    notifyAccountListeners();
    return;
  }

  const result = await loadProfile(user);
  currentSession = result.account;
  notifyAccountListeners();
}

// Keep the cached account synchronized with Supabase Auth.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentSession = null;
    notifyAccountListeners();
    return;
  }

  if (session?.user) {
    // Defer profile queries so they do not run inside the
    // synchronous Supabase Auth callback.
    Promise.resolve().then(() =>
      refreshCurrentAccount(session.user)
    );
  }
});

// Initialize the cached account when the app starts.
supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error("Could not restore session:", error.message);
      return;
    }

    return refreshCurrentAccount(data.session?.user ?? null);
  })
  .catch((error) => {
    console.error("Session initialization failed:", error);
  });

// Existing components expect these synchronous getters.
// They return the cached account, which loads asynchronously
// when the application starts.
export function getCurrentSession() {
  return currentSession;
}

export function getCurrentUser() {
  return {
    role: currentSession?.role ?? null,
    profile: currentSession,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  currentSession = null;
  notifyAccountListeners();
}

export async function fetchAccountById(id) {
  if (!id) return null;

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) return null;

  // Users may fetch only their own account through this function.
  if (authData.user.id !== id) return null;

  const result = await loadProfile(authData.user);
  return result.account;
}

export async function findAccountById(id) {
  return fetchAccountById(id);
}

export async function findAccountByEmail(email) {
  if (!email) return null;

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) return null;

  // Do not expose other users' accounts through email lookup.
  if (authData.user.email?.toLowerCase() !== normalizedEmail) {
    return null;
  }

  const result = await loadProfile(authData.user);
  return result.account;
}

// --------------------------------------------------
// SIGN UP
// Supabase sends the real confirmation email.
// No password or OTP is saved in localStorage.
// --------------------------------------------------

export async function signUp(role, fields) {
  const email = String(fields.email ?? "").trim().toLowerCase();
  const password = String(fields.password ?? "");

  if (!email || !password) {
    return {
      success: false,
      reason: "Email and password are required.",
    };
  }

  if (!["donor", "receiver", "ngo"].includes(role)) {
    return {
      success: false,
      reason: "Please select a valid account role.",
    };
  }

  const name =
    role === "ngo" ? fields.ngoName : fields.fullName;

  const metadata = {
    role,
    name: name ?? "",
    ngoName: role === "ngo" ? fields.ngoName ?? "" : "",
    phone: fields.phone ?? "",
    location: fields.location ?? "",
    contactPerson: fields.contactPerson ?? "",
    address: fields.address ?? "",
    registrationNumber: fields.registrationNumber ?? "",
    ngoStatus: role === "ngo" ? "Pending" : null,
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    return {
      success: false,
      reason: error.message,
    };
  }

  if (!data.user) {
    return {
      success: false,
      reason: "Supabase did not return a user account.",
    };
  }

  // With email confirmation enabled, Supabase normally returns
  // no session until the user confirms their email. Do not try
  // to create the profile before confirmation.
  const account = makeAccount(data.user);

  return {
    success: true,
    account,
    needsEmailConfirmation: !data.session,
    message: data.session
      ? "Account created."
      : "Check your email for the confirmation link.",
  };
}

// --------------------------------------------------
// EMAIL VERIFICATION
// Supabase email confirmation replaces the fake OTP.
// --------------------------------------------------

export async function verifyAccountOtp(accountId) {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      success: false,
      reason: "email_confirmation_required",
    };
  }

  if (accountId && data.user.id !== accountId) {
    return {
      success: false,
      reason: "none",
    };
  }

  if (!data.user.email_confirmed_at) {
    return {
      success: false,
      reason: "email_confirmation_required",
    };
  }

  const result = await loadProfile(data.user);
  currentSession = result.account;

  return {
    success: result.success,
    account: result.account,
    reason: result.reason,
  };
}

export async function resendAccountOtp(accountId) {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      success: false,
      reason: "Please sign up again or sign in first.",
    };
  }

  if (accountId && data.user.id !== accountId) {
    return {
      success: false,
      reason: "Account does not match.",
    };
  }

  const { error: resendError } =
    await supabase.auth.resend({
      type: "signup",
      email: data.user.email,
    });

  if (resendError) {
    return {
      success: false,
      reason: resendError.message,
    };
  }

  return {
    success: true,
    message: "Confirmation email sent.",
  };
}

// --------------------------------------------------
// LOGIN
// Only confirmed email accounts can sign in when
// Supabase email confirmation is enabled.
// --------------------------------------------------

export async function login(email, password) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    const message = error.message ?? "";

    if (message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        reason: "not_verified",
      };
    }

    return {
      success: false,
      reason: "Incorrect email or password.",
    };
  }

  const result = await loadProfile(data.user);

  if (!result.success || !result.account?.role) {
    await supabase.auth.signOut();

    return {
      success: false,
      reason:
        result.reason ??
        "Your account role is missing. Please contact the administrator.",
    };
  }

  currentSession = result.account;
  notifyAccountListeners();

  return {
    success: true,
    account: result.account,
  };
}

// --------------------------------------------------
// NGO ADMIN APPROVAL
// These functions need a database-backed NGO approval
// workflow. The currently confirmed profiles columns do
// not include an NGO status column or admin account list.
// --------------------------------------------------

export async function fetchPendingNgoAccounts() {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Please sign in first.");
  }

  // This client-side query intentionally does not pretend
  // that all Auth users can be listed from the profiles table.
  // Add a database-backed NGO approval workflow separately.
  return [];
}

export async function approveNgoAccount() {
  throw new Error(
    "NGO approval needs a database-backed approval workflow."
  );
}

export async function rejectNgoAccount() {
  throw new Error(
    "NGO rejection needs a database-backed approval workflow."
  );
}