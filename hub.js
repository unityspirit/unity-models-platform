const SUPABASE_URL = 'https://kveeztvdazzrfgmoewmx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWV6dHZkYXp6cmZnbW9ld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTgzMzAsImV4cCI6MjA5ODE3NDMzMH0.hncnqcw63eUp4VZe3zuYwmvWQVQkd6tKnzyDotGKul0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentModelData = null;
let currentTelegramId = null;

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('login-status');
    const telegramId = document.getElementById('telegram-id').value;
    const btn = e.target.querySelector('button');

    statusEl.textContent = 'Authenticating...';
    btn.disabled = true;

    try {
        const { data, error } = await supabase
            .from('models')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (error || !data) {
            statusEl.textContent = '❌ Profile not found. Please register via @unitymodelsbot first.';
            statusEl.className = 'status-msg text-center error';
            btn.disabled = false;
            return;
        }

        // Login successful
        currentModelData = data;
        currentTelegramId = telegramId;

        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('subtitle').style.display = 'none';
        
        document.getElementById('model-name').textContent = data.first_name || 'Model';

        // Pre-fill form
        const profile = data.profile_data || {};
        if (profile.height) document.getElementById('height').value = profile.height;
        if (profile.weight) document.getElementById('weight').value = profile.weight;
        if (profile.hair_color) document.getElementById('hair_color').value = profile.hair_color;
        if (profile.eye_color) document.getElementById('eye_color').value = profile.eye_color;
        if (profile.skills) document.getElementById('skills').value = Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills;
        if (profile.portfolio_link) document.getElementById('portfolio_link').value = profile.portfolio_link;

    } catch (err) {
        console.error('Error logging in:', err);
        statusEl.textContent = '❌ An error occurred.';
        statusEl.className = 'status-msg text-center error';
        btn.disabled = false;
    }
});

// Handle Profile Update
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('update-status');
    const btn = e.target.querySelector('button');
    
    statusEl.textContent = 'Saving...';
    statusEl.className = 'status-msg text-center';
    btn.disabled = true;

    // Merge existing profile data with new form data
    const updatedProfileData = {
        ...currentModelData.profile_data,
        height: parseInt(document.getElementById('height').value) || null,
        weight: parseInt(document.getElementById('weight').value) || null,
        hair_color: document.getElementById('hair_color').value || null,
        eye_color: document.getElementById('eye_color').value || null,
        skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s),
        portfolio_link: document.getElementById('portfolio_link').value || null
    };

    try {
        const { error } = await supabase
            .from('models')
            .update({ profile_data: updatedProfileData })
            .eq('telegram_id', currentTelegramId);

        if (error) throw error;

        statusEl.textContent = '✅ Profile updated successfully! Changes are live across the agency.';
        statusEl.className = 'status-msg text-center success';
    } catch (err) {
        console.error('Error updating profile:', err);
        statusEl.textContent = '❌ Failed to update profile.';
        statusEl.className = 'status-msg text-center error';
    } finally {
        btn.disabled = false;
    }
});
