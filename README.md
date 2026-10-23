# Green Tech Empire

A responsive green-and-white storefront built with plain HTML, CSS and JavaScript. It includes a product catalogue with category filters, account UI, email verification, transfer-reference submission, customer order status, an optional ₦10 tip, and an owner admin page.

## Files
- `index.html` — storefront, account modal, catalogue, order form, about/contact sections
- `admin.html` — owner-only view for pending orders and manual transfer verification
- `css/style.css` — responsive green-and-white styling
- `js/main.js` — catalogue, filters, form UI and customer order list
- `js/auth.js` — Firebase email/password accounts and email verification link
- `js/orders.js` — transfer input validation, submission hash and Firestore order storage
- `js/config.js` — Firebase web configuration and owner email
- `assets/` — product photos

## Important before launch
**This project is not live until Firebase is configured and every product price is entered.** Product prices are intentionally left as `null`; do not guess prices. The storefront displays “Price on request” until you set them, and the order form will not accept an order for an unpriced item.

### 1. Configure Firebase
1. Create a project at https://console.firebase.google.com and add a Web app.
2. Copy its web config into `js/config.js`, replacing the `PASTE_...` placeholders.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, add the domain where the site will be hosted.
5. In **Firestore Database**, create a database and publish the rules below.
6. Set `ADMIN_EMAIL` in `js/config.js` to the shop owner's email. Use the same email in the Firestore rules below.
7. Create the owner account, open the email verification link, then sign in to `admin.html`.

New customer accounts receive a Firebase verification email. Customers must verify their email before they can submit an order. Browsing the catalogue does not require an account.

### 2. Set product prices
In `js/main.js`, each product in `PRODUCTS` has a `price: null` property. Replace `null` with the real whole-naira price for that product, for example `price: 450000`. Do not use example prices as real prices. Once saved, the optional ₦10 tip is added to the product price when selected.

### 3. Firestore security rules
Replace `owner@example.com` with the same owner email configured in `js/config.js`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == "owner@example.com"
        && request.auth.token.email_verified == true;
    }
    match /orders/{orderId} {
      allow create: if request.auth != null
        && request.auth.token.email_verified == true
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.status == "pending"
        && request.resource.data.keys().hasOnly(["uid","name","email","productId","productName","amount","tip","reference","hash","status","createdAt"]);
      allow read: if (request.auth != null && resource.data.uid == request.auth.uid) || isAdmin();
      allow update: if isAdmin()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["status","verifiedAt","verifiedBy"])
        && request.resource.data.status == "verified";
      allow delete: if false;
    }
  }
}
```

### 4. Payment workflow and safety
1. The customer browses and selects a product.
2. The customer transfers using payment details supplied directly by the shop, then submits the amount and bank transfer reference.
3. The order is saved as `pending` and shown in the customer's order list.
4. The owner independently checks the bank account and marks the order `verified` in `admin.html`.

Client-side validation and the SHA-256 submission hash do **not** prove that money was received. The owner's bank confirmation is the real verification step. Never collect bank PINs, passwords, card details or one-time passcodes in this site. Do not put Firebase Admin SDK credentials or private secrets in frontend code.

### 5. Run locally
From this folder, run:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. A local HTTP server is required for JavaScript modules; opening `index.html` as a `file://` URL may not work.

### 6. Hosting
Deploy the folder to a static host such as Firebase Hosting or Netlify, and add the deployed domain to Firebase Authentication's authorized domains. Test signup, email verification, order submission, customer order visibility and admin authorization before accepting real orders.
