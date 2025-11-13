import React from 'react';
import { CheckCircleIcon } from './Icons';
import type { Plan, PlanId } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void;
  currentPlanId: PlanId;
  plans: Record<PlanId, Plan>;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan, currentPlanId, plans }) => {
  if (!isOpen) return null;

  const planList = Object.values(plans);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Choose Your Plan</h2>
            <p className="text-slate-500 mt-2">Start for free, then upgrade as you grow.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FIX: Explicitly type `plan` as `Plan` to fix type inference issue. */}
            {planList.map((plan: Plan) => (
                 <div key={plan.id} className={`p-6 rounded-lg border-2 flex flex-col ${currentPlanId === plan.id ? 'border-indigo-500' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                    <p className="text-slate-500 mt-1 flex-grow">{plan.description}</p>
                    <div className="my-6">
                        <span className="text-4xl font-bold text-slate-800">€{plan.price}</span>
                        {plan.price > 0 && <span className="text-slate-500"> / month</span>}
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 mb-8">
                       <li className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>Process up to <strong>{plan.invoiceLimit.toLocaleString()}</strong> invoices</span>
                       </li>
                       <li className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>AI-powered data extraction</span>
                       </li>
                         <li className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>Excel & CSV export</span>
                       </li>
                    </ul>

                    <button 
                        onClick={() => onSelectPlan(plan.id)}
                        disabled={currentPlanId === plan.id}
                        className="w-full mt-auto px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-70 bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-slate-400"
                    >
                        {currentPlanId === plan.id ? 'Current Plan' : 'Choose Plan'}
                    </button>
                </div>
            ))}
        </div>
        <div className="text-center mt-6">
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;