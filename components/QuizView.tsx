import React, { useState, useEffect, useMemo } from 'react';
import { QuizQuestion, UserAnswer, QuizSettings } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  fileName: string;
  onComplete: (answers: UserAnswer[]) => void;
  onExit: () => void;
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
  
  // Stores finalized answers for previous topics + current topic draft answers
  // We use a Map or Object to store answers by Question ID to allow navigating back and forth
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  
  // Topic Result State
  const [showTopicResult, setShowTopicResult] = useState(false);
  const [topicScore, setTopicScore] = useState(0);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(settings.secondsPerQuestion);

  const currentTopic = topics[currentTopicIndex];
  const currentQuestion = currentTopic.questions[currentQuestionInTopic];
  
  // Get currently selected option for the active question from our map
  const currentSelectedOption = answersMap[currentQuestion.id] ?? null;

  // Timer Effect
  useEffect(() => {
    if (settings.timerMode === 'unlimited' || showTopicResult) return;

    setTimeLeft(settings.secondsPerQuestion);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // When time runs out, if no answer selected, we effectively select nothing (or keep current) and move next?
          // For this specific UX, we'll just auto-move to next question if time runs out.
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, settings, showTopicResult]);

  const handleOptionSelect = (idx: number) => {
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestion.id]: idx
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionInTopic > 0) {
      setCurrentQuestionInTopic(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionInTopic < currentTopic.questions.length - 1) {
      setCurrentQuestionInTopic(prev => prev + 1);
    } else {
      // If it's the last question, we submit the topic
      handleSubmitTopic();
    }
  };

  const handleSubmitTopic = () => {
    // Calculate score for this topic based on current answersMap
    const topicQuestions = currentTopic.questions;
    let correctCount = 0;

    topicQuestions.forEach(q => {
      const selected = answersMap[q.id];
      if (selected === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = (correctCount / topicQuestions.length) * 100;
    setTopicScore(score);
    setShowTopicResult(true);
  };

  const handleRetryTopic = () => {
    // Clear answers for this topic
    setAnswersMap(prev => {
      const newMap = { ...prev };
      currentTopic.questions.forEach(q => {
        delete newMap[q.id];
      });
      return newMap;
    });

    setCurrentQuestionInTopic(0);
    setShowTopicResult(false);
  };

  const handleNextTopic = () => {
    setShowTopicResult(false);
    
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(prev => prev + 1);
      setCurrentQuestionInTopic(0);
    } else {
      // Format all answers for the final analysis
      const finalAnswers: UserAnswer[] = questions.map(q => ({
        questionId: q.id,
        selectedOptionIndex: answersMap[q.id] ?? -1,
        isCorrect: answersMap[q.id] === q.correctAnswerIndex
      }));
      onComplete(finalAnswers);
    }
  };

  // Logic for feedback UI
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
            {isPassed ? 'Topic Completed!' : 'Topic Failed'}
          </h2>
          <p className="text-slate-500 mb-8 text-lg">
            You scored <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{Math.round(topicScore)}%</span> on 
            <span className="font-semibold text-slate-800"> {currentTopic.name}</span>.
            {isPassed ? ' You can proceed.' : ' You need 70% to pass.'}
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
                {currentTopicIndex < topics.length - 1 ? 'Next Topic' : 'View Final Analysis'}
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
              const isSelected = currentSelectedOption === idx;
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group
                    ${isSelected 
                       ? 'border-green-500 bg-green-50' 
                       : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                    ${isSelected 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:border-slate-300'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-base ${isSelected ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-between items-center">
         <button
            onClick={handlePrevious}
            disabled={currentQuestionInTopic === 0}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2
              ${currentQuestionInTopic === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
         </button>

         <button
           onClick={handleNext}
           className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
            ${currentQuestionInTopic === currentTopic.questions.length - 1 
               ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
               : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
         >
           {currentQuestionInTopic === currentTopic.questions.length - 1 ? 'Submit Topic' : 'Next Question'}
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
         </button>
      </div>
    </div>
  );
};