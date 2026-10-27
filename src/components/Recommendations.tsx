import { Heart, Moon, Sun, Brain, Footprints, Users } from 'lucide-react';

type Props = {
  topEmotion: string | null;
};

type Recommendation = {
  icon: typeof Heart;
  title: string;
  description: string;
};

const recommendationsByEmotion: Record<string, Recommendation[]> = {
  joy: [
    { icon: Users, title: 'Share the Positivity', description: 'Share what made you happy with a friend or family member — positive emotions amplify when shared.' },
    { icon: Brain, title: 'Practice Gratitude', description: 'Take a moment to write down three things you are grateful for today to reinforce this positive state.' },
    { icon: Footprints, title: 'Move Your Body', description: 'Consider a short walk or light stretching to channel this good energy into your body.' },
  ],
  sadness: [
    { icon: Users, title: 'Connect With Someone', description: 'Consider reaching out to a trusted friend, family member, or someone you feel safe with.' },
    { icon: Sun, title: 'Engage in Gentle Activity', description: 'A short walk outside, light stretching, or a warm shower can gently lift your mood.' },
    { icon: Brain, title: 'Practice Self-Compassion', description: 'It is okay to feel sad. Treat yourself the way you would treat a good friend in the same situation.' },
  ],
  anger: [
    { icon: Brain, title: 'Pause and Breathe', description: 'Try the 4-7-8 technique: inhale for 4 seconds, hold for 7, exhale for 8. This calms the nervous system.' },
    { icon: Footprints, title: 'Physical Release', description: 'Consider a brisk walk, exercise, or even pressing against a wall to release physical tension safely.' },
    { icon: Users, title: 'Express Constructively', description: 'When ready, communicate your feelings using "I" statements rather than blame or accusations.' },
  ],
  fear: [
    { icon: Brain, title: 'Ground Yourself', description: 'Try the 5-4-3-2-1 technique: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.' },
    { icon: Heart, title: 'Self-Soothe', description: 'Place a hand on your chest and breathe slowly. Remind yourself that feelings of fear pass with time.' },
    { icon: Users, title: 'Talk It Through', description: 'Sharing what worries you with someone you trust can reduce the intensity of fear significantly.' },
  ],
  love: [
    { icon: Users, title: 'Express Your Appreciation', description: 'Tell the person you love what they mean to you. Expressing care strengthens bonds.' },
    { icon: Heart, title: 'Savor the Feeling', description: 'Take a few minutes to sit with this warm feeling and let it fill your awareness fully.' },
    { icon: Brain, title: 'Act on It', description: 'Consider a small kind gesture — a message, a call, or an act of service for someone you care about.' },
  ],
  disgust: [
    { icon: Brain, title: 'Acknowledge the Feeling', description: 'Disgust is a natural response. Identify what triggered it so you can process it consciously.' },
    { icon: Footprints, title: 'Step Away', description: 'If the source is something you can step away from, give yourself permission to take a break from it.' },
    { icon: Users, title: 'Process With Someone', description: 'Talking through what disturbed you with a trusted person can help you understand and move past it.' },
  ],
  excitement: [
    { icon: Brain, title: 'Channel the Energy', description: 'Excitement is high-energy positivity. Direct it into something productive or creative you have been meaning to do.' },
    { icon: Users, title: 'Share the Enthusiasm', description: 'Share what you are excited about with someone — enthusiasm is contagious and amplifies when expressed.' },
    { icon: Footprints, title: 'Stay Grounded', description: 'While enjoying the excitement, take a deep breath to stay present and avoid getting overwhelmed by the rush.' },
  ],
  neutral: [
    { icon: Moon, title: 'Check In With Yourself', description: 'A neutral state is a good baseline. Take a moment to notice how your body feels and what is on your mind.' },
    { icon: Brain, title: 'Reflect on the Day', description: 'Use this calm moment to reflect on what went well today and what you might want to adjust tomorrow.' },
    { icon: Footprints, title: 'Engage in Something Meaningful', description: 'When feeling neutral, it can be a good time to start a meaningful activity or learn something new.' },
  ],
  surprise: [
    { icon: Brain, title: 'Process the Unexpected', description: 'Give yourself a moment to absorb what just happened. Surprises can shift perspectives quickly.' },
    { icon: Users, title: 'Share Your Reaction', description: 'Discussing a surprising event with someone helps you process and make sense of it.' },
    { icon: Sun, title: 'Stay Open', description: 'Unexpected moments often carry hidden opportunities. Stay curious about where this leads.' },
  ],
};

const generalRecommendations: Recommendation[] = [
  { icon: Moon, title: 'Prioritize Rest', description: 'Aim for 7-9 hours of quality sleep. A well-rested mind processes emotions more effectively.' },
  { icon: Footprints, title: 'Move Daily', description: 'Even 20 minutes of moderate physical activity releases endorphins that support emotional wellbeing.' },
  { icon: Users, title: 'Stay Connected', description: 'Regular social interaction — even brief — is one of the strongest predictors of long-term wellness.' },
];

export default function Recommendations({ topEmotion }: Props) {
  const recs = topEmotion
    ? recommendationsByEmotion[topEmotion] ?? generalRecommendations
    : generalRecommendations;

  const title = topEmotion
    ? `Suggestions for "${topEmotion}"`
    : 'General Wellbeing Suggestions';

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">Supportive Suggestions</h2>
      </div>

      <div className="rounded-2xl glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">
          General, non-diagnostic wellbeing suggestions. These do not constitute medical advice.
        </p>
        <div className="space-y-3">
          {recs.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{rec.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{rec.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
