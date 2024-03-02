const gd = require('./gold-digger')

test('Should tell if the playlist name is in a dictionary values', () => {
  expect(gd.GDPlaylistExists({ 'id': 'name' })).toBe(false);
  expect(gd.GDPlaylistExists({ 'id': gd.GDPlaylistName })).toBe(true);
}); 