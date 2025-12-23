export function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const idMatch = line.match(/tvg-id="([^"]+)"/);

      currentChannel = {
        id: idMatch ? idMatch[1] : `channel-${i}`,
        name: nameMatch ? nameMatch[1] : 'Unknown',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Other',
      };
    } else if (line && !line.startsWith('#') && currentChannel.name) {
      currentChannel.url = line;
      channels.push({ ...currentChannel });
      currentChannel = {};
    }
  }

  return channels;
}

export function groupChannelsByCategory(channels) {
  return channels.reduce((acc, channel) => {
    const group = channel.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(channel);
    return acc;
  }, {});
}

export function filterChannels(channels, query) {
  const lowerQuery = query.toLowerCase();
  return channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(lowerQuery) ||
      channel.group.toLowerCase().includes(lowerQuery)
  );
}
