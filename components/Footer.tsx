
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DocumentTextIcon } from './Icons'; 

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
  };

  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <DocumentTextIcon className="w-7 h-7 text-indigo-400" />
              <h1 className="text-xl font-bold text-white">Invoice AI Parser</h1>
            </div>
            <p className="text-sm text-slate-400">
              {t('footer.about')}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }} className="hover:text-indigo-400 transition-colors">{t('header.features')}</a></li>
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }} className="hover:text-indigo-400 transition-colors">{t('header.how_it_works')}</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }} className="hover:text-indigo-400 transition-colors">{t('header.pricing')}</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo('faq'); }} className="hover:text-indigo-400 transition-colors">{t('header.faq')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-indigo-400 transition-colors">{t('footer.privacy_policy')}</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-indigo-400 transition-colors">{t('footer.terms_of_service')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@invoiceaiparser.com" className="hover:text-indigo-400 transition-colors">support@invoiceaiparser.com</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
          <p>&copy; 2024 Invoice AI Parser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
