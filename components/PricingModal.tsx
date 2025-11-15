
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './Icons';
import type { Plan, PlanId } from '../types';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- Configuration ---
// IMPORTANT: Replace with your actual publishable key. It's safe to expose this in the frontend.
const STRIPE_PUBLISHABLE_KEY = "pk_test_51PbsA5RqcWwIeHkP3F5y6hN1DEk3qSt0cs5a7yLdeWDoaFzAnz5pA9VbJ2zTGNkpqd7T2n6SzoM957QZXaFxDR3z00qAbUfAb4";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// --- CheckoutForm Component ---
interface CheckoutFormProps {
    plan: Plan;
    onSuccessfulPayment: (planId: PlanId) => void;
    onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ plan, onSuccessfulPayment, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // IMPORTANT: Change this to your actual payment completion page
                return_url: `${window.location.origin}`,
            },
        });

        // This point will only be reached if there is an immediate error when confirming the payment.
        if (error.type === "card_error" || error.type === "validation_error") {
            setErrorMessage(error.message || "An unexpected error occured.");
        } else {
            setErrorMessage("An unexpected error occurred. Please try again.");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Pay with Card for {plan.name} Plan</h3>
            <PaymentElement />
            {errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={!stripe || isLoading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading ? "Processing..." : `Pay €${plan.price}`}
                </button>
            </div>
        </form>
    );
};


// --- PricingModal Component ---
interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void;
  currentPlanId: PlanId;
  plans: Record<PlanId, Plan>;
  userEmail: string;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan, currentPlanId, plans, userEmail }) => {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        // Reset state when modal is closed or opened
        setSelectedPlan(null);
        setClientSecret(null);
    }, [isOpen]);

    const handlePlanSelection = async (plan: Plan) => {
        if (plan.price === 0) {
            onSelectPlan(plan.id);
            onClose();
        } else {
            setSelectedPlan(plan);
            // --- !!! BACKEND LOGIC (SIMULATED) !!! ---
            // In a real application, you would make an API call to your backend (e.g., a Firebase Cloud Function)
            // This function would create a Stripe PaymentIntent and return its client secret.
            //
            // Example Firebase Function call:
            // const response = await functions.httpsCallable('createStripePaymentIntent')({ planId: plan.id, userEmail });
            // setClientSecret(response.data.clientSecret);
            //
            // For demonstration, we simulate this call.
            console.log("Simulating backend call to create PaymentIntent...");
            // This is a mock server endpoint for creating payment intent. We will replace this with a firebase function later
            try {
                const response = await fetch("https://stripe-server-mock.glitch.me/create-payment-intent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ amount: plan.price * 100, currency: 'eur', customer_email: userEmail }), // Stripe expects amount in cents
                });
                const data = await response.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    console.error("Failed to get client secret");
                }
            } catch (error) {
                console.error("Error fetching client secret:", error);
            }
        }
    };

    const handleSuccessfulPayment = () => {
        if(selectedPlan) {
            onSelectPlan(selectedPlan.id);
        }
        onClose();
    };

    if (!isOpen) return null;

    const planList = Object.values(plans);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>

                {selectedPlan && clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                            plan={selectedPlan} 
                            onSuccessfulPayment={() => handleSuccessfulPayment()} 
                            onCancel={() => {setSelectedPlan(null); setClientSecret(null);}}
                        />
                    </Elements>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">Choose Your Plan</h2>
                            <p className="text-slate-500 mt-2">Start for free, then upgrade as you grow.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        onClick={() => handlePlanSelection(plan)}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default PricingModal;
