import { LanguagesManager } from './LanguagesManager';

export async function testLanguagesManager() {
  try {
    console.log('Testing LanguagesManager...');

    const languagesManager = LanguagesManager.getInstance();
    await languagesManager.initialize();

    // Test saving a language
    const testLanguage = {
      lc: 'en',
      ln: 'English',
      ang: 'English',
      ld: 'ltr' as const,
      gw: true,
      hc: 'US',
      lr: 'North America',
      pk: 1,
      alt: ['English'],
      cc: ['US', 'GB', 'CA']
    };

    await languagesManager.saveLanguage(testLanguage);
    console.log('✓ Language saved successfully');

    // Test retrieving the language
    const retrievedLanguage = await languagesManager.getLanguage('en');
    console.log('✓ Language retrieved:', retrievedLanguage);

    // Test marking as having collections
    await languagesManager.markLanguageAsHavingCollections('en');
    console.log('✓ Language marked as having collections');

    // Test getting languages with collections
    const languagesWithCollections = await languagesManager.getLanguagesWithCollections();
    console.log('✓ Languages with collections:', languagesWithCollections.length);

    // Test getting stats
    const stats = await languagesManager.getLanguageStats();
    console.log('✓ Language stats:', stats);

    console.log('LanguagesManager test completed successfully!');
    return true;
  } catch (error) {
    console.error('LanguagesManager test failed:', error);
    return false;
  }
}
