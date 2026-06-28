const SUPABASE_URL = 'https://kveeztvdazzrfgmoewmx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWV6dHZkYXp6cmZnbW9ld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTgzMzAsImV4cCI6MjA5ODE3NDMzMH0.hncnqcw63eUp4VZe3zuYwmvWQVQkd6tKnzyDotGKul0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById('casting-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('status');
    const btn = e.target.querySelector('button');
    
    statusEl.textContent = 'Posting...';
    statusEl.className = 'status-msg text-center';
    btn.disabled = true;

    const title = document.getElementById('title').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const gender = document.getElementById('gender').value;
    const age_range = document.getElementById('age_range').value;
    const description = document.getElementById('description').value;

    const structuredData = {
        title: title,
        location: location,
        date: date,
        description: description,
        requirements: {
            gender: gender !== 'any' ? gender : null,
            age_range: age_range || null
        }
    };

    try {
        const { error } = await supabase
            .from('castings')
            .insert({
                raw_text: description,
                structured_data: structuredData,
                source: 'Unity Director Portal',
                is_public: true
            });

        if (error) throw error;

        statusEl.textContent = '✅ Casting posted successfully! It is now live on the platform.';
        statusEl.className = 'status-msg text-center success';
        e.target.reset();
    } catch (err) {
        console.error('Error posting casting:', err);
        statusEl.textContent = '❌ Failed to post casting. Please check console or try again.';
        statusEl.className = 'status-msg text-center error';
    } finally {
        btn.disabled = false;
    }
});
