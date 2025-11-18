
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon, DocumentTextIcon } from './Icons';
import type { Plan } from '../types';
import Faq from './Faq';

interface LandingPageProps {
  plans: Plan[];
}

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();
  
    const changeLanguage = (lng: string) => {
      i18n.changeLanguage(lng);
    };
  
    return (
      <div className="flex space-x-2 text-sm">
        <button 
          onClick={() => changeLanguage('en')} 
          className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
        >
          EN
        </button>
        <button 
          onClick={() => changeLanguage('ru')} 
          className={`px-2 py-1 rounded ${i18n.language === 'ru' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
        >
          RU
        </button>
      </div>
    );
  };

const LandingPage: React.FC<LandingPageProps> = ({ plans }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
    };

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const planList = Object.values(plans);

    return (
        <div className="bg-white text-slate-800 font-sans">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 border-b border-slate-200">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="#" className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-7 h-7 text-indigo-600" />
                        <h1 className="text-xl font-bold">Invoice AI Parser</h1>
                    </a>
                    <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                        <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }} className="hover:text-indigo-600 transition-colors">{t('header.features')}</a>
                        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }} className="hover:text-indigo-600 transition-colors">{t('header.how_it_works')}</a>
                        <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }} className="hover:text-indigo-600 transition-colors">{t('header.pricing')}</a>
                        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo('faq'); }} className="hover:text-indigo-600 transition-colors">{t('header.faq')}</a>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher />
                        <button 
                            onClick={handleGetStarted}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                        >
                            {t('header.login')}
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-50">
                    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
                        <div className="text-center md:text-left">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight" dangerouslySetInnerHTML={{ __html: t('hero.title', { 1: '<span class="text-indigo-600">', postProcess: 'html' }) }} />
                            <p className="mt-6 text-lg text-slate-600">
                                {t('hero.subtitle')}
                            </p>
                            <div className="mt-10">
                                <button
                                    onClick={handleGetStarted}
                                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all"
                                >
                                    {t('hero.cta')}
                                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                                </button>
                                <p className="mt-4 text-xs text-slate-500">{t('hero.cta_note')}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <img 
                                src="https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                                alt="Invoice processing demonstration" 
                                className="rounded-xl shadow-2xl w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                </section>
                
                {/* How It Works Section */}
                <section id="how-it-works" className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t('how_it_works.title')}</h2>
                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{t('how_it_works.subtitle')}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-10 text-center relative">
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
                                <svg width="100%" height="2">
                                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8"/>
                                </svg>
                            </div>
                            <div className="relative bg-white z-10">
                                <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center bg-slate-100 text-indigo-600 rounded-full font-bold text-2xl border-2 border-white ring-4 ring-slate-100">1</div>
                                <h3 className="text-xl font-semibold mb-2">{t('how_it_works.step1_title')}</h3>
                                <p className="text-slate-600">{t('how_it_works.step1_description')}</p>
                            </div>
                            <div className="relative bg-white z-10">
                                <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center bg-slate-100 text-indigo-600 rounded-full font-bold text-2xl border-2 border-white ring-4 ring-slate-100">2</div>
                                <h3 className="text-xl font-semibold mb-2">{t('how_it_works.step2_title')}</h3>
                                <p className="text-slate-600">{t('how_it_works.step2_description')}</p>
                            </div>
                            <div className="relative bg-white z-10">
                                <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center bg-slate-100 text-indigo-600 rounded-full font-bold text-2xl border-2 border-white ring-4 ring-slate-100">3</div>
                                <h3 className="text-xl font-semibold mb-2">{t('how_it_works.step3_title')}</h3>
                                <p className="text-slate-600">{t('how_it_works.step3_description')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t('features.title')}</h2>
                                <p className="mt-4 text-lg text-slate-600">{t('features.subtitle')}</p>
                                <ul className="mt-8 space-y-6">
                                    <li className="flex items-start">
                                        <CheckCircleIcon className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-lg">{t('features.feature1_title')}</h4>
                                            <p className="text-slate-600">{t('features.feature1_description')}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircleIcon className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-lg">{t('features.feature2_title')}</h4>
                                            <p className="text-slate-600">{t('features.feature2_description')}</p>
                                        </div>
                                    </li>
                                     <li className="flex items-start">
                                        <CheckCircleIcon className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-lg">{t('features.feature3_title')}</h4>
                                            <p className="text-slate-600">{t('features.feature3_description')}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div>
                               <img 
                                    src="https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                                    alt="Business analytics dashboard" 
                                    className="rounded-xl shadow-2xl w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Pricing Section */}
                <section id="pricing" className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t('pricing.title')}</h2>
                            <p className="mt-4 text-lg text-slate-600">{t('pricing.subtitle')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {planList.map((plan: Plan) => (
                                <div key={plan.id} className={`p-8 rounded-xl border flex flex-col ${plan.id === 'pro' ? 'border-indigo-500' : 'border-slate-200'}`}>
                                    <h3 className="text-xl font-semibold text-slate-900">{t(`plans.${plan.id}.name`)}</h3>
                                    <p className="text-slate-500 mt-2 flex-grow">{t(`plans.${plan.id}.description`)}</p>
                                    <div className="my-8 text-center">
                                        <span className="text-5xl font-extrabold text-slate-900">€{plan.price}</span>
                                        {plan.price > 0 && <span className="text-slate-500"> / {i18n.language === 'ru' ? 'месяц' : 'month'}</span>}
                                    </div>
                                    <ul className="space-y-4 text-sm text-slate-600 mb-8">
                                       <li className="flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-3" />
                                            <span><strong>{plan.invoiceLimit.toLocaleString()}</strong> {t('plans.invoices_per_month', { count: plan.invoiceLimit })}</span>
                                       </li>
                                       <li className="flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-3" />
                                            <span>{t('plans.ai_powered_extraction')}</span>
                                       </li>
                                         <li className="flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-3" />
                                            <span>{t('plans.excel_csv_export')}</span>
                                       </li>
                                    </ul>
                                    <button 
                                        onClick={handleGetStarted}
                                        className={`w-full mt-auto px-6 py-3 text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${plan.id === 'pro' ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300'}`}
                                    >
                                        {t('pricing.cta')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Faq />

                 {/* Final CTA Section */}
                <section className="py-20 bg-slate-800 text-white">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl md:text-4xl font-bold">{t('cta_final.title')}</h2>
                         <p className="mt-4 max-w-2xl mx-auto text-slate-300">
                           {t('cta_final.subtitle')}
                        </p>
                        <div className="mt-8">
                           <button
                                onClick={handleGetStarted}
                                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-slate-900 bg-white rounded-lg shadow-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transform hover:scale-105 transition-all"
                            >
                                {t('cta_final.cta')}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;