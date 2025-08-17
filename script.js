// --- script.js ---
// Updated JavaScript file with corrected Supabase functions.

// --- Supabase Setup ---
const SUPABASE_URL = 'https://nxnqjhzzyyoxnkzeddwk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bnFqaHp6eXlveG5remVkZHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTAyMTksImV4cCI6MjA3MDk4NjIxOX0.9ZYZwhmKI2iy5znJiTG3z7Wgy9dUMP_l9y1bTyDpmYc';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Global UI Elements ---
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const scrapbookUI = document.getElementById('scrapbook-ui');
const scrapbookBook = document.getElementById('scrapbook-book');
const loadingMessage = document.getElementById('loading-message');
const authErrorMessage = document.getElementById('auth-error-message');
const registerErrorMessage = document.getElementById('register-error-message');

// --- Page Navigation Functions ---
const showLogin = () => {
    loginPage.classList.remove('hidden');
    registerPage.classList.add('hidden');
    scrapbookUI.classList.add('hidden');
    authErrorMessage.classList.add('hidden');
};

const showRegister = () => {
    loginPage.classList.add('hidden');
    registerPage.classList.remove('hidden');
    scrapbookUI.classList.add('hidden');
    registerErrorMessage.classList.add('hidden');
};

// --- Event Listeners for Page Navigation ---
// Correctly target both "register" and "login" links
document.querySelector('#login-page #register-link').addEventListener('click', showRegister);
document.querySelector('#register-page #login-link').addEventListener('click', showLogin);

// --- Authentication Functions ---
document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authErrorMessage.textContent = error.message;
        authErrorMessage.classList.remove('hidden');
    } else {
        authErrorMessage.classList.add('hidden');
        renderApp();
    }
});

document.getElementById('register-button').addEventListener('click', async () => {
    const email = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;

    if (email && password) {
        const { data, error } = await _supabase.auth.signUp({ email, password });

        if (error) {
            registerErrorMessage.textContent = error.message;
            registerErrorMessage.classList.remove('hidden');
        } else {
            // After sign up, Supabase sends a session object, so we can render the app
            renderApp();
        }
    } else {
        registerErrorMessage.textContent = "Please provide an email and password!";
        registerErrorMessage.classList.remove('hidden');
    }
});

document.getElementById('logout-button').addEventListener('click', async () => {
    await _supabase.auth.signOut();
    showLogin();
});

// --- Data Handling ---
document.getElementById('add-entry-button').addEventListener('click', async () => {
    const { data: { user } } = await _supabase.auth.getUser(); // FIXED: Use new method to get user

    if (!user) {
        alert("You must be logged in to save an entry.");
        return;
    }

    const nameInput = document.getElementById('name-input');
    const memoryInput = document.getElementById('memory-input');
    const hobbiesInput = document.getElementById('hobbies-input');
    const reminderInput = document.getElementById('reminder-input');
    const contactNoInput = document.getElementById('contact-no-input');
    const callMeInput = document.getElementById('call-me-input');
    const callYouInput = document.getElementById('call-you-input');
    const ourBondInput = document.getElementById('our-bond-input');
    const aboutMeInput = document.getElementById('about-me-input');

    const newEntry = {
        name: nameInput.value.trim(),
        memory: memoryInput.value.trim(),
        hobbies: hobbiesInput.value.trim(),
        reminder: reminderInput.value.trim(),
        contactNo: contactNoInput.value.trim(),
        callMe: callMeInput.value.trim(),
        callYou: callYouInput.value.trim(),
        ourBond: ourBondInput.value.trim(),
        aboutMe: aboutMeInput.value.trim(),
        user_id: user.id
    };

    if (!newEntry.name) {
        alert("Please fill in your name.");
        return;
    }

    const { data, error } = await _supabase.from('entries').insert([newEntry]);

    if (error) {
        console.error('Error:', error);
        alert("Error saving data. Check the console for details.");
    } else {
        alert("Entry saved to your scrapbook!");
        initScrapbook();
    }

    nameInput.value = '';
    memoryInput.value = '';
    hobbiesInput.value = '';
    reminderInput.value = '';
    contactNoInput.value = '';
    callMeInput.value = '';
    callYouInput.value = '';
    ourBondInput.value = '';
    aboutMeInput.value = '';
});

// --- Turn.js Navigation ---
document.getElementById('prev-page-button').addEventListener('click', () => {
    $(scrapbookBook).turn('previous');
});

document.getElementById('next-page-button').addEventListener('click', () => {
    $(scrapbookBook).turn('next');
});

// --- Main Application Logic ---
const renderApp = async () => {
    const { data: { session } } = await _supabase.auth.getSession(); // FIXED: Use new method to get session

    if (session) {
        loginPage.classList.add('hidden');
        registerPage.classList.add('hidden');
        scrapbookUI.classList.remove('hidden');
        await initScrapbook();
    } else {
        loginPage.classList.remove('hidden');
        registerPage.classList.add('hidden');
        scrapbookUI.classList.add('hidden');
    }
};

// --- Scrapbook Initialization ---
const initScrapbook = async () => {
    loadingMessage.classList.remove('hidden');
    scrapbookBook.innerHTML = '';

    const { data: { user } } = await _supabase.auth.getUser(); // FIXED: Use new method to get user
    if (!user) return;

    const { data: entries, error } = await _supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error("Error fetching entries:", error);
        return;
    }

    if ($(scrapbookBook).turn) {
        try {
            $(scrapbookBook).turn('destroy');
        } catch (e) { /* Ignore */ }
    }

    let pagesHtml = `
        <div class="page cover-page flex flex-col justify-center items-center">
            <h2 class="text-4xl font-extrabold text-[#A43636]">My Digital Scrapbook</h2>
            <button id="cover-open-button" class="mt-8">Tap to Open</button>
        </div>
    `;

    if (entries && entries.length > 0) {
        entries.forEach(entry => {
            pagesHtml += `
                <div class="page">
                    <div class="page-content">
                        <h2 class="text-3xl font-bold mb-4 text-center">${entry.name}'s Entry</h2>
                        <div class="space-y-4">
                            <p><strong>Your Favorite Memory:</strong> ${entry.memory || 'N/A'}</p>
                            <p><strong>Your Hobbies:</strong> ${entry.hobbies || 'N/A'}</p>
                            <p><strong>A Thing that Reminds you of me:</strong> ${entry.reminder || 'N/A'}</p>
                            <h3 class="text-2xl font-bold mt-8">Your Answers on Contact</h3>
                            <p><strong>Contact No:</strong> ${entry.contactNo || 'N/A'}</p>
                            <p><strong>Can I call you if I ever needed you?:</strong> ${entry.callMe || 'N/A'}</p>
                            <p><strong>Would you ever call me if you were in trouble?:</strong> ${entry.callYou || 'N/A'}</p>
                            <h3 class="text-2xl font-bold mt-8">A Page About Our Bond</h3>
                            <p><strong>Something about our bond:</strong> ${entry.ourBond || 'N/A'}</p>
                            <p><strong>Something you would like to write about me:</strong> ${entry.aboutMe || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        pagesHtml += `
            <div class="page flex items-center justify-center text-center">
                <p class="text-gray-400 text-xl">No memories saved yet. Add some from the form below!</p>
            </div>
        `;
    }

    scrapbookBook.innerHTML = pagesHtml;

    $(scrapbookBook).turn({
        width: '100%',
        height: '100%',
        autoCenter: true,
        duration: 800,
        gradients: true,
        elevation: 50,
    });

    document.getElementById('cover-open-button').addEventListener('click', () => {
        $(scrapbookBook).turn('next');
    });

    const addEntryHeading = document.getElementById('add-entry-heading');
    if (addEntryHeading && user) {
        addEntryHeading.textContent = `${user.email.split('@')[0]}'s Scrapbook: Save an Entry`;
    }

    loadingMessage.classList.add('hidden');
    scrapbookBook.classList.remove('hidden');
};

// Initial render check
document.addEventListener('DOMContentLoaded', renderApp);


