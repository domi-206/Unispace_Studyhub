import React, { useState, useEffect, useMemo } from 'react';
import { QuizQuestion, UserAnswer, QuizSettings } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  fileName: string;
  onComplete: (answers: UserAnswer[]) => void;
  onExit: () => void;
}

interface TopicGroup {
  name: string;
  questions: QuizQuestion[];
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, settings, fileName, onComplete, onExit }) => {
  // Group questions by topic
  const topics = useMemo(() => {
    const groups: { [key: string]: QuizQuestion[] } = {};
    questions.forEach(q => {
      if (!groups[q.topic]) groups[q.topic] = [];
      groups[q.topic].push(q);
    });
    return Object.keys(groups).map(topic => ({
      name: topic,
      questions: groups[topic]
    }));
  }, [questions]);

  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentQuestionInTopic, setCurrentQuestionInTopic] = useState(0);
  const [allAnswers, setAllAnswers] = useState<UserAnswer[]>([]);
  
  // Interactive State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false); // New: to show feedback immediately
  const [showTopicResult, setShowTopicResult] = useState(false);
  const [topicScore, setTopicScore] = useState(0);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(settings.secondsPerQuestion);

  const currentTopic = topics[currentTopicIndex];
  const currentQuestion = currentTopic.questions[currentQuestionInTopic];

  // Timer Effect
  useEffect(() => {
    if (settings.timerMode === 'unlimited' || showTopicResult || isAnswered) return;

    setTimeLeft(settings.secondsPerQuestion);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, settings, showTopicResult, isAnswered]);

  const handleTimeOut = () => {
    // Timeout implies incorrect/unanswered. 
    // We treat it as wrong.
    setSelectedOption(-1); // -1 indicates time ran out / no selection
    setIsAnswered(true);
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
  };

  const handleNext = () => {
    // Save current answer
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: selectedOption ?? -1,
      isCorrect
    };

    const filteredAnswers = allAnswers.filter(a => a.questionId !== currentQuestion.id);
    const updatedAnswers = [...filteredAnswers, newAnswer];
    setAllAnswers(updatedAnswers);

    // Reset state for next question
    setIsAnswered(false);
    setSelectedOption(null);

    // Check if Topic is Finished
    if (currentQuestionInTopic < currentTopic.questions.length - 1) {
      setCurrentQuestionInTopic(prev => prev + 1);
    } else {
      calculateTopicResult(updatedAnswers);
    }
  };

  const calculateTopicResult = (answersSnapshot: UserAnswer[]) => {
    const topicQIds = currentTopic.questions.map(q => q.id);
    const topicAnswers = answersSnapshot.filter(a => topicQIds.includes(a.questionId));
    
    const correctCount = topicAnswers.filter(a => a.isCorrect).length;
    const score = (correctCount / currentTopic.questions.length) * 100;
    
    setTopicScore(score);
    setShowTopicResult(true);
  };

  const handleRetryTopic = () => {
    setCurrentQuestionInTopic(0);
    setShowTopicResult(false);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleNextTopic = () => {
    setShowTopicResult(false);
    setIsAnswered(false);
    setSelectedOption(null);
    
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(prev => prev + 1);
      setCurrentQuestionInTopic(0);
    } else {
      onComplete(allAnswers);
    }
  };

  // Logic for feedback UI
  const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
  const isPassed = topicScore >= 70;
  
  // Calculate total progress
  const totalQuestions = topics.reduce((acc, t) => acc + t.questions.length, 0);
  const questionsPassed = topics.slice(0, currentTopicIndex).reduce((acc, t) => acc + t.questions.length, 0) + currentQuestionInTopic;
  const overallProgress = (questionsPassed / totalQuestions) * 100;

  // Topic Result Overlay
  if (showTopicResult) {
    return (
      <div className="max-w-2xl mx-auto w-full mt-10 p-6">
        <div className={`bg-white rounded-2xl shadow-xl border-t-8 p-10 text-center animate-fade-in
          ${isPassed ? 'border-green-500' : 'border-red-500'}`}>
          
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4
            ${isPassed ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
            {isPassed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isPassed ? 'Topic Mastered!' : 'Needs Improvement'}
          </h2>
          <p className="text-slate-500 mb-8 text-lg">
            You scored <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{Math.round(topicScore)}%</span> on 
            <span className="font-semibold text-slate-800"> {currentTopic.name}</span>.
            {isPassed ? ' You are ready for the next section.' : ' You need 70% to proceed.'}
          </p>

          <div className="flex justify-center gap-4">
            {!isPassed && (
              <button 
                onClick={handleRetryTopic}
                className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-100 hover:bg-red-700 hover:scale-105 transition-all"
              >
                Retry Topic
              </button>
            )}
            {isPassed && (
              <button 
                onClick={handleNextTopic}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-100 hover:bg-green-700 hover:scale-105 transition-all"
              >
                {currentTopicIndex < topics.length - 1 ? 'Next Topic' : 'See Full Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-0">
      {/* Header */}
      <div className="pt-8 pb-6">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Study Hub
        </button>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{currentTopic.name} Quiz</h1>
              <p className="text-slate-500 text-sm mt-1">Based on "{fileName}"</p>
            </div>
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
              Question {currentQuestionInTopic + 1} of {currentTopic.questions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-1">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="text-right">
              {settings.timerMode === 'timed' && (
                  <span className={`text-xs font-mono font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-slate-400'}`}>
                      Time: {timeLeft}s
                  </span>
              )}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <div className="p-8">
          <p className="text-slate-400 text-sm font-medium mb-4">
             {currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice Question' : 'True or False'}
          </p>
          
          <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              // Determine style state
              let borderColor = 'border-slate-200 hover:border-slate-300';
              let bgColor = 'bg-white hover:bg-slate-50';
              let textColor = 'text-slate-600';
              let icon = null;

              if (isAnswered) {
                // Logic after answering
                if (idx === currentQuestion.correctAnswerIndex) {
                   borderColor = 'border-green-500';
                   bgColor = 'bg-green-50';
                   textColor = 'text-green-700 font-medium';
                   icon = (
                     <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   );
                } else if (idx === selectedOption) {
                   borderColor = 'border-red-500';
                   bgColor = 'bg-red-50';
                   textColor = 'text-red-700 font-medium';
                   icon = (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                   );
                } else {
                   borderColor = 'border-slate-100 opacity-50';
                }
              } else {
                // Logic before answering
                if (selectedOption === idx) {
                  borderColor = 'border-green-500'; // Selection color before submitting
                  bgColor = 'bg-green-50';
                  textColor = 'text-green-700 font-medium';
                }
              }

              return (
                <div 
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group
                    ${borderColor} ${bgColor}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                      ${isAnswered 
                        ? (idx === currentQuestion.correctAnswerIndex ? 'bg-green-100 text-green-700 border-green-200' : 
                           idx === selectedOption ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200')
                        : (selectedOption === idx ? 'bg-green-600 text-white border-green-600' : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:border-slate-300')
                      }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-base ${textColor}`}>
                      {option}
                    </span>
                  </div>
                  {icon && <div>{icon}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Section - Shows only after answering */}
        {isAnswered && (
          <div className={`p-6 border-t animate-fade-in ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-1 rounded-full ${isCorrect ? 'bg-green-200' : 'bg-red-200'}`}>
                 {isCorrect ? (
                    <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 ) : (
                    <svg className="w-4 h-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 )}
              </div>
              <div>
                <h4 className={`font-bold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h4>
                <p className={`text-sm leading-relaxed ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {currentQuestion.explanation || "Well done."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-end">
        {!isAnswered ? (
           <button
             onClick={checkAnswer}
             disabled={selectedOption === null}
             className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all
               ${selectedOption !== null 
                 ? 'bg-green-600 hover:bg-green-700 hover:scale-105 shadow-green-200' 
                 : 'bg-slate-300 cursor-not-allowed'}`}
           >
             Check Answer
           </button>
        ) : (
           <button
             onClick={handleNext}
             className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold shadow-lg hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2"
           >
             {currentQuestionInTopic === currentTopic.questions.length - 1 ? 'Finish Topic' : 'Next Question'}
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
           </button>
        )}
      </div>
    </div>
  );
};