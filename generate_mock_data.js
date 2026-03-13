const fs = require('fs');

const mockRequests = [
    {
        id: '1001',
        title: 'Q1 Corporate Update',
        type: 'Video',
        priority: 'High',
        deadline: '2026-03-30',
        status: 'pending',
        description: 'A 2-minute talking head video from the CEO.',
        dateSubmitted: new Date().toISOString(),
        metadata: {
            Platforms: 'YouTube, Internal',
            Duration: '1-3 minutes'
        }
    },
    {
        id: '1002',
        title: 'Spring Sale Instagram Posts',
        type: 'Graphic',
        priority: 'Medium',
        deadline: '2026-04-05',
        status: 'pending',
        description: 'Need 5 carousel images for the spring promotion.',
        dateSubmitted: new Date().toISOString(),
        metadata: {
            Purpose: 'Social Media',
            Dimensions: '1080x1080'
        }
    },
    {
        id: '1003',
        title: 'New Office Headshots',
        type: 'Photo',
        priority: 'Low',
        deadline: '2026-04-15',
        status: 'completed',
        description: 'Professional headshots for the new engineering hires.',
        dateSubmitted: new Date('2026-03-01').toISOString(),
        metadata: {
            ShootType: 'Corporate Headshots',
            Location: 'Main HQ Studio'
        }
    },
    {
        id: '1004',
        title: 'App Explainer Animation',
        type: 'Animation',
        priority: 'High',
        deadline: '2026-05-01',
        status: 'pending',
        description: 'A slick UI motion graphic showing how the new feature works.',
        dateSubmitted: new Date().toISOString(),
        metadata: {
            Style: '2D Flat/Vector',
            Voiceover: 'Yes - Script provided'
        }
    }
];

const mockScript = `
    const initialData = ${JSON.stringify(mockRequests)};
    if (!localStorage.getItem('mediaTrackRequests')) {
        localStorage.setItem('mediaTrackRequests', JSON.stringify(initialData));
    }
`;

fs.writeFileSync('inject_mock.html', `<script>${mockScript}</script>`, 'utf8');
