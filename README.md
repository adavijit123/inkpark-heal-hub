# InkPark Healer

Build a mobile-first “InkPark Tattoo Aftercare Portal” for InkPark Tattoo Studio.

The goal is to give every client a unique aftercare page after their tattoo session.

### Client Flow

Tattoo completed → Client receives QR/unique link → Opens “Your Tattoo Aftercare” portal.

Show:

- Client name

- Tattoo date

- Artist

- Tattoo type/style

- Placement

- Tattoo photo

### Aftercare Timeline

Create a simple day-by-day timeline:

- Day 1

- Day 2–3

- Day 4–7

- Week 2

- Week 3–4

- Fully Healed

Each stage should show clear studio-approved aftercare instructions, including:

- Cleaning

- Moisturizing

- What to avoid

- What is normal during healing

- When to contact InkPark

### Healing Photo Tracker

Allow clients to upload healing photos at different stages:

Day 1 → Day 3 → Day 7 → Day 14 → Day 30

Show them as a private healing timeline.

### Support

Add a simple:

“Need help with your tattoo?”

button that opens InkPark WhatsApp/contact option.

Clients can optionally send a message and photo to the studio.

### Aftercare Reminder

Prepare the system for automatic reminders at Day 1, Day 3, Day 7, Day 14 and Day 30.

### Review & Rebooking

After the healing period, show:

“Happy with your InkPark experience? 🖤”

→ Connect to the existing InkPark Review Generator.

Then:

“Ready for your next tattoo?”

→ Book Appointment

### Admin Dashboard

Allow InkPark admin to:

- Create/manage clients

- Create tattoo records

- Assign artist

- Add tattoo photo

- Generate unique client QR/link

- Edit aftercare instructions

- View healing photos

- Manage reminders

- See review/rebooking status

### Privacy

Client photos and information must be private by default. Do not make photos public without explicit client permission.

Keep the design consistent with the existing InkPark Review Generator: minimal, premium, clean black-and-white tattoo-studio aesthetic and extremely easy to use on mobile.

Do not add unnecessary buttons or complicated steps.

Build it with a scalable database so multiple tattoos can be stored under one client profile in the future.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://inkpark-heal-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5582eb7d-f0d6-4f67-935d-59f844654c72).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
