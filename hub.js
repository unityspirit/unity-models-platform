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
        
        if (profile.current_location) document.getElementById('current-location').value = profile.current_location;
        if (profile.availability_status) document.getElementById('availability-status').value = profile.availability_status;

        renderGallery();

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

// Render Portfolio Gallery
function renderGallery() {
    const gallery = document.getElementById('portfolio-gallery');
    gallery.innerHTML = '';
    const images = currentModelData.profile_data?.portfolio_images || [];
    
    images.forEach(url => {
        const div = document.createElement('div');
        div.className = 'portfolio-img-container';
        div.innerHTML = `<img src="${url}" alt="Portfolio Image">`;
        gallery.appendChild(div);
    });
}

// Handle Photo Upload
document.getElementById('btn-upload').addEventListener('click', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('upload-status');
    const fileInput = document.getElementById('photo-upload');
    const files = fileInput.files;

    if (files.length === 0) {
        statusEl.textContent = 'Please select files to upload.';
        statusEl.className = 'status-msg text-center error';
        return;
    }

    statusEl.textContent = 'Uploading...';
    statusEl.className = 'status-msg text-center';
    e.target.disabled = true;

    try {
        let uploadedUrls = currentModelData.profile_data?.portfolio_images || [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTelegramId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('portfolios')
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('portfolios')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrlData.publicUrl);
        }

        // Update DB
        const updatedProfileData = {
            ...currentModelData.profile_data,
            portfolio_images: uploadedUrls
        };

        const { error: dbError } = await supabase
            .from('models')
            .update({ profile_data: updatedProfileData })
            .eq('telegram_id', currentTelegramId);
            
        if (dbError) throw dbError;

        currentModelData.profile_data = updatedProfileData;
        renderGallery();
        
        statusEl.textContent = '✅ Photos uploaded successfully!';
        statusEl.className = 'status-msg text-center success';
        fileInput.value = ''; // clear
    } catch (err) {
        console.error('Error uploading:', err);
        statusEl.textContent = '❌ Upload failed. Ensure the "portfolios" bucket exists.';
        statusEl.className = 'status-msg text-center error';
    } finally {
        e.target.disabled = false;
    }
});

// Handle Calendar Update
document.getElementById('calendar-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('calendar-status');
    const btn = e.target.querySelector('button');
    
    statusEl.textContent = 'Updating...';
    statusEl.className = 'status-msg text-center';
    btn.disabled = true;

    const location = document.getElementById('current-location').value;
    const status = document.getElementById('availability-status').value;

    const updatedProfileData = {
        ...currentModelData.profile_data,
        current_location: location,
        availability_status: status
    };

    try {
        const { error } = await supabase
            .from('models')
            .update({ profile_data: updatedProfileData })
            .eq('telegram_id', currentTelegramId);

        if (error) throw error;
        currentModelData.profile_data = updatedProfileData;

        statusEl.textContent = '✅ Availability updated!';
        statusEl.className = 'status-msg text-center success';
    } catch (err) {
        console.error('Error updating calendar:', err);
        statusEl.textContent = '❌ Failed to update availability.';
        statusEl.className = 'status-msg text-center error';
    } finally {
        btn.disabled = false;
    }
});
