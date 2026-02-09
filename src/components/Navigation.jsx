
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { User, LogOut, LayoutDashboard, ChevronDown, Shield } from 'lucide-react';

const Navigation = ({ onSave }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();
  const { isAdmin } = useAdmin();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleCancel = () => {
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.delete('edit');
    // If it was a new course creation, go back to courses list
    if (location.pathname.includes('/new')) {
      navigate('/courses');
    } else {
      navigate(`${location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
    }
    toast({
      title: "Changes discarded",
      description: "All changes have been reverted.",
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-morphism shadow-lg' : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">RaiderGO</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/courses"
              className="text-text-secondary hover:text-primary transition-fast font-medium"
            >
              Courses
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="text-text-secondary hover:text-primary transition-fast font-medium flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                Admin Center
              </Link>
            )}

            <Link
              to="/pricing"
              className="text-text-secondary hover:text-primary transition-fast font-medium"
            >
              Pricing
            </Link>

            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-fast focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="max-w-[150px] truncate">{currentUser.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 text-sm text-text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-sm text-text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Center
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-text-secondary hover:text-primary transition-fast font-medium"
                >
                  Login
                </Link>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-primary hover:bg-opacity-90 text-white btn-glow"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
