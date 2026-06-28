// Initialize Supabase Client
const SUPABASE_URL = 'https://kveeztvdazzrfgmoewmx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWV6dHZkYXp6cmZnbW9ld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTgzMzAsImV4cCI6MjA5ODE3NDMzMH0.hncnqcw63eUp4VZe3zuYwmvWQVQkd6tKnzyDotGKul0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('castings-container');
    if (!container) return;

    try {
        const { data: castings, error } = await supabase
            .from('castings')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        container.innerHTML = ''; // Clear loading text

        if (!castings || castings.length === 0) {
            container.innerHTML = '<p class="card-text">No live public castings available at the moment. Check back later!</p>';
            return;
        }

        castings.forEach(casting => {
            const data = casting.structured_data || {};
            
            // Format requirements beautifully
            let requirementsHTML = '';
            if (data.requirements) {
                const reqs = data.requirements;
                if (reqs.gender) requirementsHTML += `<span><strong>Gender:</strong> ${reqs.gender}</span><br>`;
                if (reqs.age_range) requirementsHTML += `<span><strong>Age:</strong> ${reqs.age_range}</span><br>`;
                if (reqs.height_min || reqs.height_max) requirementsHTML += `<span><strong>Height:</strong> ${reqs.height_min || ''}-${reqs.height_max || ''} cm</span><br>`;
            }

            const card = document.createElement('div');
            card.className = 'card card-glass portfolio-card reveal-3d';
            card.style.transform = 'translateY(0)';
            card.style.opacity = '1';
            
            card.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: #bca476;">
                        ${casting.source} • ${new Date(casting.created_at).toLocaleDateString()}
                    </span>
                </div>
                <h3 class="card-title accent-text">${data.title || 'Casting Call'}</h3>
                <p class="card-text" style="margin-bottom: 10px;">${data.location || 'Location TBA'} ${data.date ? ' | ' + data.date : ''}</p>
                <div class="card-text" style="margin-bottom: 20px; font-size: 0.9rem; opacity: 0.8;">
                    ${requirementsHTML}
                </div>
                <p class="card-text">${data.description || 'See details via our Telegram Bot.'}</p>
                <a href="https://t.me/unitymodelsbot" target="_blank" class="btn btn-outline" style="margin-top: 20px; display: inline-block; width: 100%; text-align: center;">Apply via Oscar AI</a>
            `;
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching castings:', error);
        container.innerHTML = '<p class="card-text">Failed to load castings. Please try refreshing.</p>';
    }
});
