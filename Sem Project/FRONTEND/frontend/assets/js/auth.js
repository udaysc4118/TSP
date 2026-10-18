// frontend/assets/js/auth.js

const CLOUD_API_URL = 'https://maharoute-ai-backend.onrender.com/api';

const API_URL = (() => {
    if (typeof window === 'undefined') return CLOUD_API_URL;
    if (window.location.protocol === 'file:') return 'http://localhost:5000/api';

    const host = window.location.hostname;
    const port = window.location.port;

    // Local development only (localhost / 127.0.0.1)
    if (host === 'localhost' || host === '127.0.0.1') {
        if (port === '5000' || !port) return `${window.location.protocol}//${host}:5000/api`;
        return `http://${host}:5000/api`;
    }

    // Vercel serverless deployment
    if (host.includes('vercel.app')) {
        return `${window.location.origin}/api`;
    }

    // Default to Render Cloud Backend
    return CLOUD_API_URL;
})();

// Safe response parser that never throws on HTML error pages
async function parseResponse(res) {
    try {
        const data = await res.json();
        return data || {};
    } catch (e) {
        return { error: res.ok ? "Unexpected server response" : `Server returned HTTP ${res.status}` };
    }
}

// Resilient API request with automatic cloud fallback
async function apiFetch(endpoint, options = {}) {
    const primaryUrl = `${API_URL}${endpoint}`;
    const fallbackUrl = `${CLOUD_API_URL}${endpoint}`;
    const urlsToTry = [primaryUrl];
    if (primaryUrl !== fallbackUrl) {
        urlsToTry.push(fallbackUrl);
    }

    let lastError = null;
    for (const url of urlsToTry) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);

            // If a host returned 404 (e.g. static host attempting local /api), fallback to cloud
            if (!res.ok && res.status === 404 && url !== fallbackUrl) {
                console.warn(`[API FALLBACK] ${url} returned 404. Falling back to Cloud API...`);
                continue;
            }
            return res;
        } catch (e) {
            console.warn(`[API FETCH FAILED] ${url}:`, e.message);
            if (e.name === 'AbortError') {
                lastError = new Error('Connection timed out. Please try again.');
            } else {
                lastError = e;
            }
        }
    }
    throw lastError || new Error('Server connection error. Please try again.');
}

// Clear any stale credentials when arriving at login page
sessionStorage.removeItem("mfp_token");
sessionStorage.removeItem("mfp_user");
localStorage.removeItem("mfp_token");
localStorage.removeItem("mfp_user");


const signupPanel = document.getElementById("signupPanel");
const loginPanel = document.getElementById("loginPanel");

const adminPanel = document.getElementById("adminPanel");
const forgotPanel = document.getElementById("forgotPanel");
const resetPanel = document.getElementById("resetPanel");

const openLogin = document.getElementById("openLogin");
const openSignup = document.getElementById("openSignup");
const openAdminLogin = document.getElementById("openAdminLogin");
const backToUserLogin = document.getElementById("backToUserLogin");
const openForgotPass = document.getElementById("openForgotPass");
const backToLoginFromForgot = document.getElementById("backToLoginFromForgot");
const backToLoginFromReset = document.getElementById("backToLoginFromReset");

function switchPanel(panel) {
    signupPanel.classList.remove('active');
    loginPanel.classList.remove('active');
    if (adminPanel) adminPanel.classList.remove('active');
    if (forgotPanel) forgotPanel.classList.remove('active');
    if (resetPanel) resetPanel.classList.remove('active');
    panel.classList.add('active');
}

if (openLogin) openLogin.onclick = (e) => { e.preventDefault(); switchPanel(loginPanel); };
if (openSignup) openSignup.onclick = (e) => { e.preventDefault(); switchPanel(signupPanel); };

if (openAdminLogin) openAdminLogin.onclick = (e) => { 
    e.preventDefault(); 
    localStorage.removeItem("mfp_token");
    localStorage.removeItem("mfp_user");
    document.getElementById("adminErr").style.display = "none";
    switchPanel(adminPanel); 
};

if (backToUserLogin) backToUserLogin.onclick = (e) => { 
    e.preventDefault(); 
    switchPanel(loginPanel); 
};

if (openForgotPass) openForgotPass.onclick = (e) => {
    e.preventDefault();
    document.getElementById("forgotErr").style.display = "none";
    document.getElementById("forgotSuccess").style.display = "none";
    document.getElementById("fp_email").value = "";
    switchPanel(forgotPanel);
};

if (backToLoginFromForgot) backToLoginFromForgot.onclick = (e) => {
    e.preventDefault();
    switchPanel(loginPanel);
};

if (backToLoginFromReset) backToLoginFromReset.onclick = (e) => {
    e.preventDefault();
    switchPanel(loginPanel);
};

function validateEmail(mail){ return /\S+@\S+\.\S+/.test(mail); }

let pendingSignup = { name: '', email: '', password: '' };

const submitSignup = document.getElementById("submitSignup");
if (submitSignup) {
    submitSignup.onclick = async () => {
        let name = document.getElementById("su_name").value.trim();
        let email = document.getElementById("su_email").value.trim().toLowerCase();
        let password = document.getElementById("su_pass").value;
        let err = document.getElementById("signupErr");

        err.style.display="none";
        if(!name||!email||!password){ err.textContent="Fill all fields"; err.style.display="block"; return; }
        if(!validateEmail(email)){ err.textContent="Invalid email"; err.style.display="block"; return; }
        if(password.length < 6){ err.textContent="Password min 6 chars"; err.style.display="block"; return; }

        submitSignup.disabled = true;
        submitSignup.innerHTML = "Sending... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/auth/signup-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            let data = await parseResponse(res);
            
            if (!res.ok) {
                err.textContent = data.error || "Signup failed";
                err.style.display = "block";
                submitSignup.disabled = false;
                submitSignup.innerHTML = "Create Account <i class='ri-arrow-right-line'></i>";
                return;
            }

            pendingSignup = { name, email, password };
            document.getElementById("signupStep1").style.display = "none";
            document.getElementById("signupStep2").style.display = "block";
            
            const suOtpInput = document.getElementById("su_otp");
            if (suOtpInput) suOtpInput.value = "";
            
            let otpSuccess = document.getElementById("otpSuccess");
            otpSuccess.innerHTML = `<i class="ri-mail-send-fill"></i> ${data.message || 'Verification code sent to your email! Please check your inbox.'}`;
            otpSuccess.style.display = "block";
            setTimeout(() => { otpSuccess.style.display = "none"; }, 8000);

            submitSignup.disabled = false;
            submitSignup.innerHTML = "Create Account <i class='ri-arrow-right-line'></i>";
        } catch(e) {
            console.error('[SIGNUP ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display="block";
            submitSignup.disabled = false;
            submitSignup.innerHTML = "Create Account <i class='ri-arrow-right-line'></i>";
        }
    };
}

const backToSignup = document.getElementById("backToSignup");
if (backToSignup) {
    backToSignup.onclick = (e) => {
        e.preventDefault();
        document.getElementById("signupStep2").style.display = "none";
        document.getElementById("signupStep1").style.display = "block";
        document.getElementById("otpErr").style.display = "none";
    };
}

const resendOtpBtn = document.getElementById("resendOtpBtn");
if (resendOtpBtn) {
    resendOtpBtn.onclick = async () => {
        let err = document.getElementById("otpErr");
        let success = document.getElementById("otpSuccess");
        err.style.display = "none";
        success.style.display = "none";
        
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = "Sending...";

        try {
            let res = await apiFetch(`/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingSignup.email })
            });
            let data = await parseResponse(res);
            
            if (!res.ok) {
                err.textContent = data.error || "Failed to resend";
                err.style.display = "block";
                resendOtpBtn.disabled = false;
                resendOtpBtn.textContent = "Resend Code";
                return;
            }

            const suOtpInput = document.getElementById("su_otp");
            if (suOtpInput) suOtpInput.value = "";
            success.innerHTML = `<i class="ri-refresh-line"></i> ${data.message || 'Fresh verification code sent to your email inbox!'}`;
            success.style.display = "block";
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend Code";
            setTimeout(() => { success.style.display = "none"; }, 6000);
        } catch(e) {
            console.error('[RESEND ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display="block";
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend Code";
        }
    }
}

const verifyOtpBtn = document.getElementById("verifyOtpBtn");
if (verifyOtpBtn) {
    verifyOtpBtn.onclick = async () => {
        let otp = document.getElementById("su_otp").value.trim();
        let err = document.getElementById("otpErr");

        err.style.display="none";
        if(!otp) { err.textContent="Enter your 6-digit code"; err.style.display="block"; return; }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = "Verifying... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/auth/signup-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...pendingSignup, otp })
            });
            let data = await parseResponse(res);
            
            if (!res.ok) {
                err.textContent = data.error || "Verification failed";
                err.style.display="block";
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerHTML = "Verify & Access";
                return;
            }

            sessionStorage.setItem("mfp_token", data.token);
            sessionStorage.setItem("mfp_user", JSON.stringify(data.user));
            localStorage.setItem("mfp_token", data.token);
            localStorage.setItem("mfp_user", JSON.stringify(data.user));
            window.location="index.html";
        } catch(e) {
            console.error('[VERIFY ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display="block";
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.innerHTML = "Verify & Access";
        }
    };
}

const submitLogin = document.getElementById("submitLogin");
if (submitLogin) {
    submitLogin.onclick = async () => {
        let email = document.getElementById("li_email").value.trim().toLowerCase();
        let password = document.getElementById("li_pass").value;
        let err = document.getElementById("loginErr");

        err.style.display="none";
        if(!email||!password){ err.textContent="Please fill out all fields"; err.style.display="block"; return; }

        submitLogin.disabled = true;
        submitLogin.innerHTML = "Authenticating... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            let data = await parseResponse(res);
            
            if (!res.ok) {
                err.textContent= data.error || "Invalid credentials";
                err.style.display="block";
                submitLogin.disabled = false;
                submitLogin.innerHTML = "Sign In <i class='ri-login-box-line'></i>";
                return;
            }

            sessionStorage.setItem("mfp_token", data.token);
            sessionStorage.setItem("mfp_user", JSON.stringify(data.user));
            localStorage.setItem("mfp_token", data.token);
            localStorage.setItem("mfp_user", JSON.stringify(data.user));
            
            if (data.user && data.user.role === 'admin') {
                window.location="admin.html";
            } else {
                window.location="index.html";
            }
        } catch(e) {
            console.error('[LOGIN ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display="block";
            submitLogin.disabled = false;
            submitLogin.innerHTML = "Sign In <i class='ri-login-box-line'></i>";
        }
    };
}

// ADMIN LOGIN HANDLER
const adminForm = document.getElementById("adminForm");
const submitAdminLogin = document.getElementById("submitAdminLogin");

if (adminForm) {
    adminForm.onsubmit = async (e) => {
        e.preventDefault();
        let email = document.getElementById("admin_email").value.trim().toLowerCase();
        let password = document.getElementById("admin_pass").value;
        let err = document.getElementById("adminErr");

        err.style.display="none";
        if(!email||!password){ err.textContent="Please verify credentials."; err.style.display="block"; return; }

        submitAdminLogin.disabled = true;
        submitAdminLogin.innerHTML = "Verifying Clearance... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: email, password }) // Send admin_id mapped appropriately!
            });
            let data = await parseResponse(res);
            
            if (!res.ok) {
                err.textContent= data.error || "Invalid clearance credentials";
                err.style.display="block";
                submitAdminLogin.disabled = false;
                submitAdminLogin.innerHTML = "Verify Clearance <i class='ri-shield-check-line'></i>";
                return;
            }

            // Trust the token explicitly for an admin!
            if (data.token) {
                sessionStorage.setItem("mfp_token", data.token);
                sessionStorage.setItem("mfp_user", JSON.stringify({ id: email, name: 'System Admin', role: 'admin' }));
                localStorage.setItem("mfp_token", data.token);
                localStorage.setItem("mfp_user", JSON.stringify({ id: email, name: 'System Admin', role: 'admin' }));
                window.location = "admin.html";
            }
        } catch(e) {
            console.error('[ADMIN LOGIN ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display="block";
            submitAdminLogin.disabled = false;
            submitAdminLogin.innerHTML = "Verify Clearance <i class='ri-shield-check-line'></i>";
        }
    };
}

// ========================
// FORGOT PASSWORD HANDLERS
// ========================

let forgotEmail = '';

// Step 1: Send reset code
const submitForgotPass = document.getElementById("submitForgotPass");
if (submitForgotPass) {
    submitForgotPass.onclick = async () => {
        let email = document.getElementById("fp_email").value.trim().toLowerCase();
        let err = document.getElementById("forgotErr");
        let success = document.getElementById("forgotSuccess");

        err.style.display = "none";
        success.style.display = "none";

        if (!email) { err.textContent = "Please enter your email"; err.style.display = "block"; return; }
        if (!validateEmail(email)) { err.textContent = "Invalid email format"; err.style.display = "block"; return; }

        submitForgotPass.disabled = true;
        submitForgotPass.innerHTML = "Sending... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            let data = await parseResponse(res);

            if (!res.ok) {
                err.textContent = data.error || "Failed to send reset code";
                err.style.display = "block";
                submitForgotPass.disabled = false;
                submitForgotPass.innerHTML = "Send Reset Code <i class='ri-mail-send-line'></i>";
                return;
            }

            forgotEmail = email;

            // Switch to reset panel (Step 2)
            document.getElementById("resetErr").style.display = "none";
            document.getElementById("resetSuccess").style.display = "none";
            document.getElementById("rp_otp").value = "";
            document.getElementById("rp_newpass").value = "";
            document.getElementById("rp_confirmpass").value = "";

            let resetSuccess = document.getElementById("resetSuccess");
            resetSuccess.innerHTML = `<i class="ri-mail-check-line"></i> ${data.message || 'Password reset code sent to your email inbox!'}`;
            resetSuccess.style.display = "block";
            setTimeout(() => { resetSuccess.style.display = "none"; }, 8000);

            switchPanel(resetPanel);

            submitForgotPass.disabled = false;
            submitForgotPass.innerHTML = "Send Reset Code <i class='ri-mail-send-line'></i>";
        } catch (e) {
            console.error('[FORGOT PASS ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display = "block";
            submitForgotPass.disabled = false;
            submitForgotPass.innerHTML = "Send Reset Code <i class='ri-mail-send-line'></i>";
        }
    };
}

// Step 2: Verify OTP and set new password
const submitResetPass = document.getElementById("submitResetPass");
if (submitResetPass) {
    submitResetPass.onclick = async () => {
        let otp = document.getElementById("rp_otp").value.trim();
        let newPassword = document.getElementById("rp_newpass").value;
        let confirmPass = document.getElementById("rp_confirmpass").value;
        let err = document.getElementById("resetErr");
        let success = document.getElementById("resetSuccess");

        err.style.display = "none";
        success.style.display = "none";

        if (!otp) { err.textContent = "Enter the 6-digit code"; err.style.display = "block"; return; }
        if (!newPassword) { err.textContent = "Enter new password"; err.style.display = "block"; return; }
        if (newPassword.length < 6) { err.textContent = "Password must be at least 6 characters"; err.style.display = "block"; return; }
        if (newPassword !== confirmPass) { err.textContent = "Passwords do not match"; err.style.display = "block"; return; }

        submitResetPass.disabled = true;
        submitResetPass.innerHTML = "Resetting... <i class='ri-loader-4-line ri-spin'></i>";

        try {
            let res = await apiFetch(`/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, otp, newPassword })
            });
            let data = await parseResponse(res);

            if (!res.ok) {
                err.textContent = data.error || "Reset failed";
                err.style.display = "block";
                submitResetPass.disabled = false;
                submitResetPass.innerHTML = "Reset Password <i class='ri-lock-password-line'></i>";
                return;
            }

            success.textContent = data.message;
            success.style.display = "block";

            submitResetPass.disabled = false;
            submitResetPass.innerHTML = "Reset Password <i class='ri-lock-password-line'></i>";

            // Auto redirect to login after 2.5 seconds
            setTimeout(() => {
                switchPanel(loginPanel);
            }, 2500);

        } catch (e) {
            console.error('[RESET PASS ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display = "block";
            submitResetPass.disabled = false;
            submitResetPass.innerHTML = "Reset Password <i class='ri-lock-password-line'></i>";
        }
    };
}

// Resend reset OTP
const resendResetOtp = document.getElementById("resendResetOtp");
if (resendResetOtp) {
    resendResetOtp.onclick = async () => {
        let err = document.getElementById("resetErr");
        let success = document.getElementById("resetSuccess");
        err.style.display = "none";
        success.style.display = "none";

        if (!forgotEmail) { err.textContent = "Session expired. Go back and try again."; err.style.display = "block"; return; }

        resendResetOtp.disabled = true;
        resendResetOtp.textContent = "Sending...";

        try {
            let res = await apiFetch(`/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            let data = await parseResponse(res);

            if (!res.ok) {
                err.textContent = data.error || "Failed to resend";
                err.style.display = "block";
            } else {
                const rpOtpInput = document.getElementById("rp_otp");
                if (rpOtpInput) rpOtpInput.value = "";
                success.innerHTML = `<i class="ri-refresh-line"></i> ${data.message || 'New reset code sent to your email inbox!'}`;
                success.style.display = "block";
                setTimeout(() => { success.style.display = "none"; }, 6000);
            }

            resendResetOtp.disabled = false;
            resendResetOtp.textContent = "Resend Code";
        } catch (e) {
            console.error('[RESEND RESET ERROR]', e);
            err.textContent = (e && e.message && e.message !== 'Failed to fetch') ? e.message : "Server connection error. Please try again.";
            err.style.display = "block";
            resendResetOtp.disabled = false;
            resendResetOtp.textContent = "Resend Code";
        }
    };
}

// Enter Key Listeners for smooth UX across forms
function bindEnterKey(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(buttonId);
    if (input && btn) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btn.click();
            }
        });
    }
}

bindEnterKey("li_email", "submitLogin");
bindEnterKey("li_pass", "submitLogin");
bindEnterKey("su_name", "submitSignup");
bindEnterKey("su_email", "submitSignup");
bindEnterKey("su_pass", "submitSignup");
bindEnterKey("su_otp", "verifyOtpBtn");
bindEnterKey("fp_email", "submitForgotPass");
bindEnterKey("rp_otp", "submitResetPass");
bindEnterKey("rp_newpass", "submitResetPass");
bindEnterKey("rp_confirmpass", "submitResetPass");
bindEnterKey("admin_email", "submitAdminLogin");
bindEnterKey("admin_pass", "submitAdminLogin");

