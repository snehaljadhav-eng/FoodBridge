# FoodBridge (frontend prototype)

A React frontend for FoodBridge — no backend, no real login yet.
All data comes from `src/data/mockData.js`.

## Run it locally

You need [Node.js](https://nodejs.org) (version 18 or newer) installed.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## Pages

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/donor` | Donor dashboard |
| `/donor/new` | Create food donation |
| `/donations/:id` | Donation details |
| `/ngo` | NGO dashboard |
| `/volunteer` | Volunteer dashboard |
| `/admin` | Admin dashboard |

## Notes

- `src/services/authService.js` returns a fixed mock "logged in" user.
  Change `MOCK_ROLE` in that file to `"donor"`, `"ngo"`, `"volunteer"`, or
  `"admin"` to preview the app as a different kind of user.
- `src/services/donationService.js` and `src/services/firebase.js` are
  structured so a real Firebase backend can be dropped in later without
  rewriting the pages.
