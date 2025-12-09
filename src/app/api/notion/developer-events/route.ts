import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DEVELOPER_EVENTS_DB_ID;
    const apiKey = process.env.NOTION_API_KEY;

    if (!databaseId || !apiKey) {
      // Return empty array if not configured
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    const cleanDbId = databaseId.trim().replace(/\s/g, '');

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error('Failed to fetch developer events from Notion');
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    const data = await response.json();
    const results = data.results || [];

    const events = results.map((page: any) => {
      const properties = page.properties || {};
      
      const name = properties['Event Name']?.title?.[0]?.plain_text || 
                  properties['Name']?.title?.[0]?.plain_text || 
                  'Unnamed Event';
      
      const dateProp = properties['Date']?.date || 
                      properties['Event Date']?.date;
      const date = dateProp?.start || '';
      
      const type = properties['Type']?.select?.name || 
                  properties['Event Type']?.select?.name || 
                  '';
      
      const guestRelation = properties['Guest']?.relation || 
                           properties['Guest Name']?.relation;
      const guestName = guestRelation?.[0] ? 'Guest Speaker' : '';
      
      const recordingLink = properties['Recording']?.url || 
                           properties['Recording Link']?.url || 
                           '';

      return {
        id: page.id,
        name,
        date,
        type,
        guestName,
        recordingLink,
      };
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching developer events:', error);
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}

