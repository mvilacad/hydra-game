import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface QuestionProps {
  question: {
    id: string;
    question: string;
    options: string[];
    correct: string;
    type: 'sword' | 'arrow' | 'magic' | 'fire';
  } | null;
  onAnswer: (answer: string) => void;
  timeLeft: number;
}

export default function Question({ question, onAnswer, timeLeft }: QuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    if (question?.id) {
      setSelectedAnswer('');
      setHasAnswered(false);
      setShowFeedback(false);
    }
  }, [question?.id]);

  // Don't render if no question
  if (!question) {
    return null;
  }

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    setShowFeedback(true);
    
    // Show feedback briefly before submitting
    setTimeout(() => {
      onAnswer(answer);
    }, 1000);
  };

  const getAttackTypeInfo = (type: string) => {
    switch (type) {
      case 'sword':
        return { name: 'Sword Strike', color: 'text-orange-400', icon: '⚔️' };
      case 'arrow':
        return { name: 'Arrow Shot', color: 'text-green-400', icon: '🏹' };
      case 'magic':
        return { name: 'Magic Spell', color: 'text-purple-400', icon: '✨' };
      case 'fire':
        return { name: 'Fire Attack', color: 'text-red-400', icon: '🔥' };
      default:
        return { name: 'Attack', color: 'text-gray-400', icon: '⚡' };
    }
  };

  const attackInfo = getAttackTypeInfo(question.type);
  const isCorrect = selectedAnswer === question.correct;

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <Card className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{attackInfo.icon}</span>
              <div>
                <h3 className="text-xl text-white">Prepare Your Attack!</h3>
                <p className={cn("text-sm", attackInfo.color)}>
                  {attackInfo.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{timeLeft}s</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
            {question.question}
          </h2>
          
          {/* Answer Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === question.correct;
              
              // Determine button state and styling
              let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";
              let iconClass = "";
              let icon = null;
              
              if (!hasAnswered) {
                // Before answering
                buttonClass += isSelected 
                  ? "border-purple-400 bg-purple-400/20 text-white"
                  : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70 text-gray-300";
              } else {
                // After answering - show feedback
                if (showFeedback) {
                  if (isCorrectAnswer) {
                    buttonClass += "border-green-400 bg-green-400/20 text-white";
                    icon = <CheckCircle className="w-5 h-5 text-green-400" />;
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonClass += "border-red-400 bg-red-400/20 text-white";
                    icon = <XCircle className="w-5 h-5 text-red-400" />;
                  } else {
                    buttonClass += "border-gray-600 bg-gray-800/30 text-gray-400";
                  }
                } else {
                  buttonClass += "border-gray-600 bg-gray-800/30 text-gray-400";
                }
              }
              
              return (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={hasAnswered}
                  className={cn(buttonClass, "h-auto justify-start")}
                  variant="ghost"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">
                        {letter}
                      </span>
                      <span className="font-medium">{option}</span>
                    </div>
                    
                    {icon && (
                      <div className="ml-auto">
                        {icon}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
          
          {/* Feedback Message */}
          {showFeedback && (
            <div className="mt-6 text-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold",
                isCorrect 
                  ? "bg-green-400/20 text-green-400 border border-green-400/30"
                  : "bg-red-400/20 text-red-400 border border-red-400/30"
              )}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Excellent! Your attack strikes true!
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Your attack misses the mark...
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {!hasAnswered && (
        <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-600/30">
          <CardContent className="p-4 text-center">
            <p className="text-gray-300 text-sm">
              Choose your answer to launch a{' '}
              <span className={attackInfo.color}>{attackInfo.name}</span>{' '}
              at the Hydra!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
