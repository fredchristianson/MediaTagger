var ENV ={
    DEBUG: false,
    PROD: true,
    API_BASE_URL: '/api/v1'
};

export default { get: function () { return ENV; } };