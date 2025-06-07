import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      common: {
        login: 'Log In',
        signup: 'Sign Up',
        logout: 'Log Out',
        dashboard: 'Dashboard',
        events: 'Events',
        calendar: 'Calendar',
        profile: 'Profile',
        settings: 'Settings',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },
      homepage: {
        hero: {
          title: 'The School Calendar, Finally Reimagined.',
          subtitle: 'Manage, discover, and join K-12 events in one beautiful, connected space.',
          browseEvents: 'Browse Events',
          tryAsSchool: 'Try as a School',
        },
        howItWorks: {
          title: 'How It Works',
          createEvents: {
            title: 'Create Events',
            description: 'Schools can easily create and manage events',
          },
          findEvents: {
            title: 'Find Events',
            description: 'Families discover and RSVP to school events',
          },
          collaborate: {
            title: 'Collaborate & Share',
            description: 'Staff and teachers coordinate seamlessly',
          },
        },
        forWho: {
          title: 'Who It\'s For',
          schools: 'Schools',
          parents: 'Parents',
          teachers: 'Teachers',
          students: 'Students',
        },
        pricing: {
          title: 'Simple, Transparent Pricing',
          free: {
            name: 'Free',
            price: '$0',
            features: ['Up to 100 events/year', 'Basic features', 'Email support'],
          },
          school: {
            name: 'School',
            price: '$99/month',
            features: ['Unlimited events', 'Analytics dashboard', 'Priority support', 'Custom branding'],
          },
          district: {
            name: 'District',
            price: '$499/month',
            features: ['Multi-school management', 'Advanced reporting', 'API access', 'Dedicated support'],
          },
        },
      },
      auth: {
        emailLabel: 'Email',
        passwordLabel: 'Password',
        confirmPasswordLabel: 'Confirm Password',
        fullNameLabel: 'Full Name',
        schoolNameLabel: 'School Name',
        districtLabel: 'District',
        roleLabel: 'Role',
        loginTitle: 'Welcome Back',
        signupTitle: 'Create Account',
        forgotPassword: 'Forgot Password?',
        rememberMe: 'Remember me',
        noAccount: 'Don\'t have an account?',
        haveAccount: 'Already have an account?',
        sendMagicLink: 'Send Magic Link',
        checkEmail: 'Check your email!',
        resetPassword: 'Reset Password',
        roles: {
          parent: 'Parent',
          teacher: 'Teacher',
          schoolAdmin: 'School Admin',
          districtAdmin: 'District Admin',
        },
      },
      dashboard: {
        welcome: 'Welcome back, {{name}}!',
        overview: 'Overview',
        upcomingEvents: 'Upcoming Events',
        recentActivity: 'Recent Activity',
        quickActions: 'Quick Actions',
        createEvent: 'Create New Event',
        viewCalendar: 'View Calendar',
        manageUsers: 'Manage Users',
        analytics: 'Analytics',
      },
    },
  },
  es: {
    translation: {
      common: {
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        logout: 'Cerrar Sesión',
        dashboard: 'Panel',
        events: 'Eventos',
        calendar: 'Calendario',
        profile: 'Perfil',
        settings: 'Configuración',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        search: 'Buscar',
        filter: 'Filtrar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
      },
      // Add Spanish translations for other sections...
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n