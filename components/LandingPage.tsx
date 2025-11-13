import React from 'react';
import { CheckCircleIcon, ArrowRightIcon, BoltIcon, ScaleIcon, WrenchScrewdriverIcon, DocumentTextIcon } from './Icons';
import type { Plan, PlanId } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  plans: Record<PlanId, Plan>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, plans }) => {
    const planList = Object.values(plans);
    return (
        <div className="bg-slate-50 text-slate-800 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 border-b border-slate-200">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-7 h-7 text-indigo-600" />
                        <h1 className="text-xl font-bold">Invoice AI Parser</h1>
                    </div>
                    <button 
                        onClick={onGetStarted}
                        className="hidden sm:inline-block px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center bg-white overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 z-0"></div>
                     <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-100 rounded-full opacity-50 -translate-x-1/4 -translate-y-1/4"></div>
                     <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full opacity-50 translate-x-1/4 translate-y-1/4"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
                            Stop Typing. <span className="text-indigo-600">Start Automating.</span>
                        </h2>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                            Transform invoice photos into structured, export-ready data in seconds with AI. Reclaim your time and eliminate costly data entry errors.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all"
                            >
                                Get Started for Free
                                <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">Free trial includes 50 invoices. No credit card required.</p>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-slate-800">Simple as 1-2-3</h3>
                            <p className="mt-2 text-slate-500 max-w-xl mx-auto">Get from paper invoice to spreadsheet in under a minute.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-bold text-2xl">1</div>
                                <h4 className="text-lg font-semibold">Upload Nomenclature</h4>
                                <p className="mt-2 text-sm text-slate-500">Your product list is the AI's brain. Upload your CSV or Excel file just once to get started.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-bold text-2xl">2</div>
                                <h4 className="text-lg font-semibold">Snap & Upload Invoice</h4>
                                <p className="mt-2 text-sm text-slate-500">Take a clear picture or upload a PDF of any invoice. Handle one or multiple files at once.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-bold text-2xl">3</div>
                                <h4 className="text-lg font-semibold">Export & Integrate</h4>
                                <p className="mt-2 text-sm text-slate-500">Review the AI-extracted data, make edits if needed, and export to CSV or aggregated Excel.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features/Pain Points Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-slate-800">End Manual Entry Headaches</h3>
                            <p className="mt-2 text-slate-500 max-w-xl mx-auto">Our tool is designed for business owners who value their time and accuracy.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-6">
                                <BoltIcon className="h-10 w-10 text-indigo-600 mb-4" />
                                <h4 className="text-lg font-semibold">Save Countless Hours</h4>
                                <p className="mt-2 text-sm text-slate-500">Our AI reads and categorizes line items faster than any human, freeing you and your staff for more important tasks.</p>
                            </div>
                             <div className="p-6">
                                <ScaleIcon className="h-10 w-10 text-indigo-600 mb-4" />
                                <h4 className="text-lg font-semibold">Eliminate Costly Errors</h4>
                                <p className="mt-2 text-sm text-slate-500">Drastically reduce mistakes from manual typing and misinterpretation. Ensure your inventory and accounting are always accurate.</p>
                            </div>
                             <div className="p-6">
                                <WrenchScrewdriverIcon className="h-10 w-10 text-indigo-600 mb-4" />
                                <h4 className="text-lg font-semibold">Customize Your Data</h4>
                                <p className="mt-2 text-sm text-slate-500">Don't get stuck with rigid formats. Reorder, rename, and toggle columns to get the exact export you need for your systems.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-slate-800">Transparent Pricing</h3>
                            <p className="mt-2 text-slate-500">Choose the plan that's right for your business.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {/* FIX: Explicitly type `plan` as `Plan` to fix type inference issue. */}
                            {planList.map((plan: Plan) => (
                                <div key={plan.id} className="p-6 rounded-lg border-2 flex flex-col bg-white border-slate-200">
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
                                        onClick={onGetStarted}
                                        className="w-full mt-auto px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                                    >
                                        Choose Plan
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                 {/* Final CTA Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6 text-center">
                         <h3 className="text-3xl font-bold text-slate-800">Ready to streamline your inventory?</h3>
                         <p className="mt-4 max-w-xl mx-auto text-slate-600">
                           Sign up now and process your first 50 invoices for free. See for yourself how much time you can save.
                        </p>
                        <div className="mt-8">
                           <button
                                onClick={onGetStarted}
                                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all"
                            >
                                Start Your Free Trial
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200">
                <div className="container mx-auto px-6 py-6 text-center text-sm text-slate-500">
                    <p>&copy; 2024 Invoice AI Parser. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;