import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, Users, Zap } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import CountrySelector from '../../components/CountrySelector';
import { getDefaultCurrency } from '../../data/countries';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('flash'); // 'flash', 'phone', 'email'
  const [currencies, setCurrencies] = useState([]);

  // Flash registration
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('XAF');
  const [referralCodeFlash, setReferralCodeFlash] = useState('');

  // Phone registration
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCodePhone, setReferralCodePhone] = useState('');

  // Email registration
  const [email, setEmail] = useState('');
  const [referralCodeEmail, setReferralCodeEmail] = useState('');

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await authService.getCurrencies();
      setCurrencies(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des devises:', error);
    }
  };

  const handleFlashSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCountry) {
      toast.error('Veuillez sélectionner votre pays');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.registerFlash({
        country: selectedCountry.code,
        currency: selectedCurrency,
        referral_code: referralCodeFlash || null,
      });

      console.log('📦 Registration response:', response);
      console.log('🔑 Credentials received:', response.data.credentials);

      // Store credentials
      if (response.data.credentials) {
        toast.success(`Bienvenue ${response.data.user.name} ! 🎉`);

        // Redirect to success page with credentials (login will be called there)
        navigate('/register/success', {
          state: {
            credentials: response.data.credentials,
            user: response.data.user,
            token: response.data.token,
          },
          replace: true,
        });
      } else {
        console.error('❌ No credentials in response');
        toast.error('Erreur: identifiants non reçus');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.registerPhone({
        phone: phoneNumber,
        referral_code: referralCodePhone || null,
      });

      console.log('📦 Registration response:', response);
      console.log('🔑 Credentials received:', response.data.credentials);

      // Store credentials
      if (response.data.credentials) {
        toast.success(`Bienvenue ${response.data.user.name} ! 🎉`);

        // Redirect to success page with credentials (login will be called there)
        navigate('/register/success', {
          state: {
            credentials: response.data.credentials,
            user: response.data.user,
            token: response.data.token,
          },
          replace: true,
        });
      } else {
        console.error('❌ No credentials in response');
        toast.error('Erreur: identifiants non reçus');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.registerEmail({
        email: email,
        referral_code: referralCodeEmail || null,
      });

      console.log('📦 Registration response:', response);
      console.log('🔑 Credentials received:', response.data.credentials);

      // Store credentials
      if (response.data.credentials) {
        toast.success(`Bienvenue ${response.data.user.name} ! 🎉`);

        // Redirect to success page with credentials (login will be called there)
        navigate('/register/success', {
          state: {
            credentials: response.data.credentials,
            user: response.data.user,
            token: response.data.token,
          },
          replace: true,
        });
      } else {
        console.error('❌ No credentials in response');
        toast.error('Erreur: identifiants non reçus');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    const defaultCurrency = getDefaultCurrency(country.code);
    setSelectedCurrency(defaultCurrency);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-gaming font-bold text-white mb-2">
          Inscription Rapide
        </h2>
        <p className="text-gray-400">
          Créez votre compte en quelques secondes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('flash')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'flash'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Flash</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('phone')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'phone'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Téléphone</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'email'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </div>
        </button>
      </div>

      {/* Flash Registration */}
      {activeTab === 'flash' && (
        <form onSubmit={handleFlashSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Votre pays
            </label>
            <CountrySelector
              value={selectedCountry}
              onChange={handleCountryChange}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Devise
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Code promo (optionnel)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={referralCodeFlash}
                onChange={(e) => setReferralCodeFlash(e.target.value.toUpperCase())}
                className="input pl-11"
                placeholder="CODE123"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            S'inscrire maintenant
          </button>

          {/* <p className="text-xs text-gray-500 text-center">
            Un nom d'utilisateur unique sera généré automatiquement
          </p> */}
        </form>
      )}

      {/* Phone Registration */}
      {activeTab === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Numéro de téléphone
            </label>
            <PhoneInput
              flags={flags}
              international
              defaultCountry="CM"
              value={phoneNumber}
              onChange={setPhoneNumber}
              className="phone-input-custom"
              placeholder="+237 6XX XXX XXX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Code promo (optionnel)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={referralCodePhone}
                onChange={(e) => setReferralCodePhone(e.target.value.toUpperCase())}
                className="input pl-11"
                placeholder="CODE123"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            S'inscrire avec téléphone
          </button>

          {/* <p className="text-xs text-gray-500 text-center">
            Un nom d'utilisateur unique sera généré automatiquement
          </p> */}
        </form>
      )}

      {/* Email Registration */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-11"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Code promo (optionnel)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={referralCodeEmail}
                onChange={(e) => setReferralCodeEmail(e.target.value.toUpperCase())}
                className="input pl-11"
                placeholder="CODE123"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            S'inscrire avec email
          </button>          {/* <p className="text-xs text-gray-500 text-center">
            Un nom d'utilisateur unique sera généré automatiquement
          </p>

 */}
        </form>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400 text-center">
          Vous pourrez compléter votre profil après l'inscription
        </p>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-200 text-gray-400">ou</span>
        </div>
      </div>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-gray-400">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-casino-purple hover:text-casino-purple-dark font-semibold">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
