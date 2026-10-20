// components/dashboard/StatusTimeline.tsx
"use client";
import { CheckCircle2, Clock, Truck, Package } from "lucide-react";

interface StatusTimelineProps {
  status: string;
  className?: string;
}

export default function StatusTimeline({ status, className = "" }: StatusTimelineProps) {
  const steps = [
    { id: 'confirmado', label: 'Confirmado', icon: CheckCircle2 },
    { id: 'separacao_estoque', label: 'Separação', icon: Package },
    { id: 'preparacao_envio', label: 'Preparação', icon: Truck },
    { id: 'enviado', label: 'Enviado', icon: Clock },
    { id: 'entregue', label: 'Entregue', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(step => step.id === status);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : isCurrent
                ? 'border-blue-500 bg-blue-50 text-blue-500'
                : 'border-gray-300 text-gray-400'
            }`}>
              <Icon size={18} />
            </div>
            <span className={`text-xs mt-2 text-center ${
              isCompleted ? 'text-green-600 font-medium' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mt-5 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}