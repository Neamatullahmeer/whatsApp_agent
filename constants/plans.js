export const PLANS = {
  free: {
    limits: {
      messagesPerMonth: 500,
      aiCallsPerDay: 50,
      appointmentsPerMonth: 30
    },
    features: {
      appointmentBooking: true,
      ownerNotifications: true,
      analytics: false
    }
  },

  pro: {
    limits: {
      messagesPerMonth: 5000,
      aiCallsPerDay: 500,
      appointmentsPerMonth: 500
    },
    features: {
      appointmentBooking: true,
      ownerNotifications: true,
      analytics: true
    }
  },

  enterprise: {
    limits: {
      messagesPerMonth: Infinity,
      aiCallsPerDay: Infinity,
      appointmentsPerMonth: Infinity
    },
    features: {
      appointmentBooking: true,
      ownerNotifications: true,
      analytics: true
    }
  }
};
