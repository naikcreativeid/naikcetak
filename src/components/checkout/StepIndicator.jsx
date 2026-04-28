const StepIndicator = ({ currentStep = 1 }) => {
  const steps = [
    { no: 1, label: 'Detail Pemesan' },
    { no: 2, label: 'Pembayaran' },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.no} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= step.no ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.no ? '✓' : step.no}
            </div>
            <span
              className={`text-xs mt-1 ${
                currentStep >= step.no ? 'text-green-600 font-medium' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-24 mx-2 mb-4 ${
                currentStep > step.no ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
