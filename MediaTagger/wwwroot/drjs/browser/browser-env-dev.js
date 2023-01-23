let ENV = {
  DEBUG: true,
  PROD: false,
  API_BASE_URL: '/api/v1'
};

export default {
  get: function () {
    return ENV;
  }
};
