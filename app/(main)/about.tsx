import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="book" size={80} color="#4a90e2" />
        </View>
        <Text style={styles.title}>Open Bible Stories</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <Text style={styles.paragraph}>
          Open Bible Stories is a collection of 50 key stories from the Bible, from Genesis to Revelation,
          designed to be easily understood and translated into any language.
        </Text>
        <Text style={styles.paragraph}>
          This app provides these stories in multiple languages with illustrations,
          making them accessible to people all over the world.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credits</Text>
        <Text style={styles.paragraph}>
          The content in this app is provided by unfoldingWord® and is made available under a
          Creative Commons Attribution-ShareAlike 4.0 International License.
        </Text>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink('https://www.unfoldingword.org/')}
        >
          <Ionicons name="globe-outline" size={18} color="#4a90e2" />
          <Text style={styles.linkText}>unfoldingWord.org</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Source</Text>
        <Text style={styles.paragraph}>
          This app is open source and available on GitHub. Contributions are welcome!
        </Text>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink('https://github.com/example/open-bible-stories-app')}
        >
          <Ionicons name="logo-github" size={18} color="#4a90e2" />
          <Text style={styles.linkText}>GitHub Repository</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.paragraph}>
          This app does not collect any personal information. All content is stored locally on your device.
        </Text>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink('https://example.com/privacy')}
        >
          <Ionicons name="document-text-outline" size={18} color="#4a90e2" />
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Questions or feedback? We'd love to hear from you.
        </Text>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink('mailto:support@example.com')}
        >
          <Ionicons name="mail-outline" size={18} color="#4a90e2" />
          <Text style={styles.linkText}>support@example.com</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2023 Open Bible Stories App
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  version: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginVertical: 4,
  },
  linkText: {
    fontSize: 16,
    color: '#4a90e2',
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});
