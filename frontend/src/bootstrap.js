import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Baca XSRF-TOKEN dari cookie (Laravel otomatis set cookie ini)
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Set interceptor untuk selalu ambil CSRF token terbaru dari cookie sebelum setiap request
window.axios.interceptors.request.use(function (config) {
    const token = getCookie('XSRF-TOKEN');
    if (token) {
        config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
});
