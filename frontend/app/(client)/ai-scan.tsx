import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  Image, 
  ScrollView,
  ActivityIndicator,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

// API URL
const API_URL = Constants.expoConfig?.extra?.backendUrl || 
                process.env.EXPO_PUBLIC_BACKEND_URL || 
                'https://barberpro-7.preview.emergentagent.com';

interface AIScanResult {
  success: boolean;
  face_shape?: string;
  recommendations: string[];
  detailed_analysis?: string;
  error?: string;
}

export default function AIScanScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIScanResult | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso denegado', 'Necesitas dar permiso para usar la cámara');
      return;
    }

    const imageResult = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!imageResult.canceled && imageResult.assets[0].base64) {
      const base64Image = imageResult.assets[0].base64;
      setImage(`data:image/jpeg;base64,${base64Image}`);
      analyzeImage(base64Image);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a tus fotos');
      return;
    }

    const imageResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!imageResult.canceled && imageResult.assets[0].base64) {
      const base64Image = imageResult.assets[0].base64;
      setImage(`data:image/jpeg;base64,${base64Image}`);
      analyzeImage(base64Image);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setAnalyzing(true);
    setResult(null);
    
    try {
      console.log('Sending image to AI analysis...');
      
      const response = await fetch(`${API_URL}/api/ai-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
          user_id: user?.user_id || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AIScanResult = await response.json();
      console.log('AI Scan result:', data);
      
      if (data.success) {
        setResult(data);
      } else {
        Alert.alert('Error', data.error || 'No se pudo analizar la imagen');
        setResult(data);
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Error de conexión', 
        'No se pudo conectar con el servidor de IA. Intenta de nuevo.'
      );
      setResult({
        success: false,
        recommendations: [],
        error: error.message
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="scan" size={32} color="#2563EB" />
          </View>
          <Text style={styles.title}>Escaneo IA Facial</Text>
          <Text style={styles.subtitle}>
            Nuestra IA analiza tu rostro y recomienda los mejores estilos de corte
          </Text>
        </View>

        <View style={styles.content}>
          {!image ? (
            <Card style={styles.uploadCard}>
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={60} color="#CBD5E1" />
              </View>
              <Text style={styles.uploadTitle}>Captura tu rostro</Text>
              <Text style={styles.uploadText}>
                Toma una foto frontal clara para obtener las mejores recomendaciones
              </Text>
              <View style={styles.uploadButtons}>
                <Button
                  title="📸 Tomar Foto"
                  onPress={pickImage}
                  variant="primary"
                  size="large"
                  style={styles.uploadButton}
                />
                <Button
                  title="🖼️ Elegir de Galería"
                  onPress={pickFromGallery}
                  variant="outline"
                  size="large"
                  style={styles.uploadButton}
                />
              </View>
            </Card>
          ) : (
            <View style={styles.resultContainer}>
              <Card style={styles.imageCard}>
                <Image source={{ uri: image }} style={styles.image} />
              </Card>

              {analyzing && (
                <Card style={styles.analyzingCard}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.analyzingText}>
                    Analizando tu rostro con IA...
                  </Text>
                  <Text style={styles.analyzingSubtext}>
                    Esto puede tomar unos segundos
                  </Text>
                </Card>
              )}

              {result && result.success && (
                <>
                  {/* Face Shape Card */}
                  {result.face_shape && (
                    <Card style={styles.faceShapeCard}>
                      <View style={styles.faceShapeHeader}>
                        <Ionicons name="person-circle" size={28} color="#2563EB" />
                        <Text style={styles.faceShapeTitle}>Forma de tu rostro</Text>
                      </View>
                      <Text style={styles.faceShapeValue}>
                        {result.face_shape.charAt(0).toUpperCase() + result.face_shape.slice(1)}
                      </Text>
                    </Card>
                  )}

                  {/* Recommendations Card */}
                  <Card style={styles.recommendationsCard}>
                    <View style={styles.recommendationsHeader}>
                      <Ionicons name="sparkles" size={24} color="#2563EB" />
                      <Text style={styles.recommendationsTitle}>
                        Cortes Recomendados
                      </Text>
                    </View>
                    {result.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View style={styles.recommendationNumber}>
                          <Text style={styles.recommendationNumberText}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </Card>

                  {/* Detailed Analysis */}
                  {result.detailed_analysis && (
                    <Card style={styles.analysisCard}>
                      <View style={styles.analysisHeader}>
                        <Ionicons name="bulb" size={24} color="#F59E0B" />
                        <Text style={styles.analysisTitle}>Análisis Detallado</Text>
                      </View>
                      <Text style={styles.analysisText}>
                        {result.detailed_analysis}
                      </Text>
                    </Card>
                  )}
                </>
              )}

              {result && !result.success && (
                <Card style={styles.errorCard}>
                  <Ionicons name="alert-circle" size={40} color="#EF4444" />
                  <Text style={styles.errorTitle}>No se pudo analizar</Text>
                  <Text style={styles.errorText}>
                    {result.error || 'Intenta con otra foto con mejor iluminación'}
                  </Text>
                </Card>
              )}

              <Button
                title="🔄 Escanear otra foto"
                onPress={resetScan}
                variant="outline"
                size="medium"
                style={styles.resetButton}
              />
            </View>
          )}

          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color="#2563EB" />
              <Text style={styles.tipsTitle}>Tips para mejores resultados</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Buena iluminación frontal</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Rostro completamente visible</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Sin gafas ni accesorios que cubran</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  uploadCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cameraIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  uploadButtons: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 16,
  },
  uploadButton: {
    width: '100%',
  },
  resultContainer: {
    gap: 16,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  image: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  analyzingCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  analyzingText: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 16,
    fontWeight: '600',
  },
  analyzingSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  faceShapeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  faceShapeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  faceShapeTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  faceShapeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 38,
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  analysisCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  analysisText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 22,
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FEF2F2',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 8,
  },
  tipsCard: {
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#15803D',
  },
});
