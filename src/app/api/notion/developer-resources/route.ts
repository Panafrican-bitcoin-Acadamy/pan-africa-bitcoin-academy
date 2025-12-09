import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DEVELOPER_RESOURCES_DB_ID;
    const apiKey = process.env.NOTION_API_KEY;

    if (!databaseId || !apiKey) {
      // Return empty array if not configured
      return NextResponse.json({ resources: [] }, { status: 200 });
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
      console.error('Failed to fetch developer resources from Notion');
      return NextResponse.json({ resources: [] }, { status: 200 });
    }

    const data = await response.json();
    const results = data.results || [];

    const resources = results.map((page: any) => {
      const properties = page.properties || {};
      
      const name = properties['Resource Name']?.title?.[0]?.plain_text || 
                  properties['Name']?.title?.[0]?.plain_text || 
                  'Unnamed Resource';
      
      const link = properties['Link']?.url || 
                  properties['URL']?.url || 
                  '';
      
      const category = properties['Category']?.select?.name || 
                      properties['category']?.select?.name || 
                      '';
      
      const difficulty = properties['Difficulty']?.select?.name || 
                        properties['difficulty']?.select?.name || 
                        '';
      
      const recommendedBy = properties['Recommended By']?.rich_text?.[0]?.plain_text || 
                           properties['recommendedBy']?.rich_text?.[0]?.plain_text || 
                           '';

      return {
        id: page.id,
        name,
        link,
        category,
        difficulty,
        recommendedBy,
      };
    });

    return NextResponse.json({ resources }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching developer resources:', error);
    return NextResponse.json({ resources: [] }, { status: 200 });
  }
}

