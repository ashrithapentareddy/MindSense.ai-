# MindSense AI — Multimodal Emotion Recognition for Mental Wellness

An educational prototype (college CSE · AI & ML project) that performs **real, in-browser text emotion classification** using a pretrained transformer model. No paid APIs, no login, no database required for the first version.

---

## Model

- **Name:** `onnx-community/tanaos-emotion-detection-v1-ONNX`
- **Base:** BERT-based model (`tanaos/tanaos-emotion-detection-v1`), fine-tuned for emotion classification
- **Classes:** `joy`, `anger`, `fear`, `sadness`, `surprise`, `disgust`, `excitement`, `neutral`
- **Runtime:** [Transformers.js](https://huggingface.co/docs/transformers.js) (`@huggingface/transformers`) — runs entirely in the browser via WebAssembly
- **Pipeline:** `text-classification` with `top_k: null` to return all eight labels with confidence scores
- The model is downloaded from Hugging Face on first load and cached by the browser for all subsequent visits
- No data is ever sent to a server — inference is fully local

---

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open the printed URL in your browser
```

### Build for production

```bash
npm run build
npm run preview
```

### Requirements
- Node.js 18+ and npm
- A modern browser with WebAssembly support
- Internet access on first load (to download the model from Hugging Face)

---

## Architecture

```
src/
├── lib/
│   └── emotionClassifier.ts    # AI inference module — model loading, caching, and prediction
├── components/
│   ├── Overview.tsx            # Project intro + three-modality roadmap
│   ├── TextWorkspace.tsx       # Text input, analyze button, results display
│   ├── ConfidenceBars.tsx      # Sorted confidence score bars
│   ├── AnalysisHistory.tsx    # Session-only history list
│   ├── Recommendations.tsx     # Emotion-aware wellbeing suggestions
│   └── AboutMethodology.tsx    # Model explanation, limitations, disclaimer
├── App.tsx                     # Layout, tab navigation, model status management
├── index.css                   # Tailwind + base styles
└── main.tsx                    # Entry point
```

### Key Design Decisions

- **Inference / UI separation:** All model logic lives in `src/lib/emotionClassifier.ts`. Components consume predictions via a clean API — no AI code inside React components.
- **Model singleton:** The pipeline is loaded once and reused. `getClassifier()` caches the promise; `analyzeEmotion()` awaits it.
- **Real predictions only:** No hardcoded outputs, no keyword-based rules. Every confidence score comes from the model's softmax output.
- **Model status:** Always visible (`idle → loading → ready` or `error`) in both the header and the Overview hero.

---

## Features

### Implemented (Text Modality)
- Enter any English sentence and click "Analyze Emotion"
- Displays all eight emotion labels with confidence scores, sorted highest to lowest
- Top prediction highlighted with confidence percentage
- Animated confidence bars
- Four sample inputs provided
- Session-only analysis history (last 20 analyses)
- Emotion-aware supportive suggestions (general wellness, not clinical advice)
- Loading progress, duplicate-submission prevention, empty-text validation, error handling
- Responsive layout for laptop and mobile

### Planned (Not Yet Implemented)
- **Facial Expression Recognition** — vision model via webcam
- **Speech Emotion Recognition** — audio model via microphone

These modules are clearly marked "Planned" in the UI. No camera or audio predictions are simulated.

---

## Limitations

- Only supports **English** text
- Classifies **eight emotion categories** — nuanced or mixed emotional states are simplified
- **Sarcasm, irony, and implicit context** are frequently misclassified
- The model inherits **biases** from its training data
- Confidence scores represent **model certainty**, not clinical probability
- Face and speech modalities are **not yet implemented**

---

## Disclaimer

MindSense AI is an **educational prototype** built for a college Computer Science (AI & ML) project. It is **not** a medical device, clinical diagnostic tool, or substitute for professional mental health care. If you are experiencing mental health challenges, please consult a qualified healthcare professional. If you are in crisis, contact your local emergency services or a crisis helpline immediately.

---

## Future Improvements

1. **Facial Expression Recognition** — integrate a vision model (e.g., `Xenova/vit-base-patch16-224` fine-tuned on FER-2013) for webcam-based emotion detection
2. **Speech Emotion Recognition** — integrate an audio model (e.g., `Xenova/wav2vec2-base-960h` fine-tuned on RAVDESS) for microphone-based emotion detection
3. **Fusion** — combine text, face, and speech predictions into a weighted multimodal ensemble
4. **Sentiment timeline** — track emotional trends over a session
5. **Multilingual support** — add models for non-English input
