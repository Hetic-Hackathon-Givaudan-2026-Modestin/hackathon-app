import './ui.css';

type StepperProps = {
  steps: string[];
  current: number;
};

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="ui-stepper" aria-label="Progression">
      {steps.map((label, index) => (
        <li
          key={label}
          className={
            index < current
              ? 'ui-stepper__item is-done'
              : index === current
                ? 'ui-stepper__item is-current'
                : 'ui-stepper__item'
          }
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="ui-stepper__dot">{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
