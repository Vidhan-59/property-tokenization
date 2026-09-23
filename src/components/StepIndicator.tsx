import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-indexed
  furthestStep: number; // highest step reached, for enabling click-back
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, furthestStep, onStepClick }: StepIndicatorProps) {
  return (
    <ol className="flex items-center w-full">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const reachable = stepNum <= furthestStep;

        return (
          <li key={step.label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick?.(stepNum)}
              className="flex items-center gap-2.5 group"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors ${
                  done
                    ? "bg-gold-400 border-gold-400 text-neutral-900"
                    : active
                      ? "border-neutral-900 text-neutral-900 bg-white"
                      : "border-neutral-200 text-neutral-400 bg-white"
                }`}
              >
                {done ? <Check size={15} /> : stepNum}
              </span>
              <span
                className={`hidden sm:block text-sm font-medium whitespace-nowrap ${
                  active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={`mx-3 h-0.5 flex-1 rounded-full ${done ? "bg-gold-400" : "bg-neutral-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
