# MoodLens

**An AI mood and well-being companion that runs in your browser.**

MoodLens reads your facial expression through your webcam, tracks how your mood changes over time, and gives gentle, supportive suggestions. It is a well-being aid, **not a medical tool**: it never diagnoses anything, and it points you to a trusted person or a qualified professional when low mood keeps showing up.

Plain HTML, CSS and JavaScript. No build step, no server, no install.

## Features

- **Real-time mood detection** from the webcam: happy, sad, angry, fearful, surprised, neutral, tired and stressed, with an intensity level.
- **Mood trend and well-being state:** improving, stable, fluctuating or declining, plus a state (Positive, Neutral, Stressed / Tense, Low Mood, Needs a Break) and a 0-100 well-being score.
- **Personalized suggestions** that get re-ranked by your Yes/No feedback and your preferred suggestion type.
- **Guided breathing** exercise.
- **Mood check-ins, journal and daily summary**, with a mood-over-time chart, a mood-by-hour heatmap and a mood mix.
- **Streaks and habits:** 3-Day Check-In, Self-Care Streak, Positive Week, Break Champion.
- **AI Coach** with a reflection, a personal tip and a chat (see "AI" below).
- **Settings:** suggestion type, favourite activity, break reminders, history length, theme, saving history, Ghost Mode on or off.
- **Metrics dashboard:** accuracy, macro F1, precision, recall, Cohen's kappa, a per-class table, a confusion matrix, accuracy over time and live system KPIs, plus an Evaluation Lab and JSON export.
- **Find Ghosts Near You:** a playful Easter egg with fictional ghosts (random ages, emotions and personalities) that appear around you, never on you, with spooky sound effects. All ghost data is made up.

## AI

| Part | What it is | Where it runs |
|---|---|---|
| Face detection | Tiny Face Detector (small CNN) | In your browser |
| Face landmarks | Face Landmark 68, tiny version (small CNN) | In your browser |
| Expression recognition | Face Expression Net (CNN, 7 expressions) | In your browser |
| Stressed and Tired | Rules on top of the model output: combined angry, fearful and disgusted probability for "stressed", and eye openness compared with your own baseline for "tired" | In your browser |
| Trend, well-being state, suggestion ranking | Simple rule-based logic and a feedback score per suggestion | In your browser |
| AI Coach | Claude (large language model) when the page runs inside Claude as an artifact; otherwise a built-in rule-based offline coach | Claude's servers, or your browser |

The three face models run through [face-api.js](https://github.com/vladmandic/face-api) on TensorFlow.js. Their weights are embedded in `models.js`, and **no video or image is ever uploaded**.

## Accuracy metrics: please read

The Metrics tab compares MoodLens' predictions with a known "true" mood. Samples can come from:

- **Evaluation Lab:** you pull an expression, capture it, and the prediction is compared with what you asked for.
- **Self-report check-ins:** your answer on the Today tab is compared with what the camera predicted.
- **Sample data:** 200 **simulated** samples built from fixed made-up rates so the dashboard can be previewed without a camera. These numbers do **not** measure the real model. The app labels them as sample data and they can be removed with one click.

Any accuracy figure you quote should come from the Evaluation Lab or check-ins, and the sample size should be stated alongside it.

## Run it

**Locally:** open `index.html` in Chrome or Edge and allow camera access.

**On GitHub Pages:** push this folder to a repository, then go to Settings, Pages, choose your branch and the root folder. The page is served over HTTPS, so the camera works.

Internet is needed for the face-api.js script (loaded from jsDelivr) and the Google Fonts. Offline, the face model cannot start and the app falls back to a demo mode where you tap a mood by hand.

## Privacy

- Video stays on your device.
- Mood history, notes and settings are stored in your browser's `localStorage`, and you can turn saving off or clear it in Settings.
- When Claude powers the AI Coach, only a short text summary (mood counts, trend, recent notes) is sent, never video.

## Limitations

- A facial expression is not a feeling. The expression model can be wrong, especially for subtle expressions, glasses, poor lighting or a resting face that looks sad.
- "Stressed" and "Tired" are heuristics, not trained classes.
- The Ghost Mode "behind you" effect estimates your body as a box from your face position. It is not true person segmentation.
- The offline coach is rule-based and cannot hold a free-form conversation.

## Project structure

```
MoodLens/
├── index.html   page markup (tabs, cards, buttons)
├── style.css    all styling and the mood-adaptive theme
├── app.js       all app logic: mood detection, trend and state, suggestions,
│                AI Coach, journal, summary, streaks, settings, metrics, Ghost Mode
├── models.js    face-model weights embedded as base64 (not meant to be edited)
└── README.md
```

Keep the four files in the same folder. `index.html` loads `style.css`, `models.js` and `app.js` in that order, after the face-api.js script.

## Credits

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) by Vincent Mühler and its maintained fork [@vladmandic/face-api](https://github.com/vladmandic/face-api), for the face models. Check their repositories for licence terms.
- Fraunces and DM Sans fonts from Google Fonts.

## Disclaimer

MoodLens is for general well-being and learning purposes only. It does not provide medical advice, diagnosis or treatment. If you are struggling, please talk to someone you trust or a qualified professional, and contact local emergency services if you are in immediate danger.
