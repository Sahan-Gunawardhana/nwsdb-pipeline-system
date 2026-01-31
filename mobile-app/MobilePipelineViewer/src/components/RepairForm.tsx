import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RepairRecord, REPAIR_CATEGORIES, Coordinates } from '../types';

interface RepairFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (repair: Omit<RepairRecord, 'id' | 'timestamp' | 'status'>) => void;
  location: Coordinates;
}

export default function RepairForm({ visible, onClose, onSubmit, location }: RepairFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRepairType, setSelectedRepairType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const additionalInfoRef = useRef<TextInput>(null);

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedRepairType('');
    setDescription('');
    setAdditionalInfo('');
    setSeverity('medium');
  };

  const handleSubmit = () => {
    if (!selectedCategory || !selectedRepairType || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const repairRecord: Omit<RepairRecord, 'id' | 'timestamp' | 'status'> = {
      location,
      locationAccuracy: location.accuracy || 10,
      category: selectedCategory,
      repairType: selectedRepairType,
      description: description.trim(),
      additionalInfo: additionalInfo.trim() || undefined,
      severity,
      reportedBy: 'current-user', // In real app, get from auth context
    };

    onSubmit(repairRecord);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const availableRepairTypes = selectedCategory ? REPAIR_CATEGORIES[selectedCategory] || [] : [];

  // Handle focus on additional info field - scroll to make it visible
  const handleAdditionalInfoFocus = () => {
    setTimeout(() => {
      // Scroll to the very bottom with extra offset for keyboard
      scrollViewRef.current?.scrollTo({ 
        y: 1000, // Large value to ensure we scroll to bottom
        animated: true 
      });
    }, 300); // Longer delay to ensure keyboard is visible
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Repair</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Location Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.accuracyText}>
                Accuracy: ±{location.accuracy || 10}m
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedRepairType(''); // Reset repair type when category changes
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category..." value="" />
                  {Object.keys(REPAIR_CATEGORIES).map((category) => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Repair Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Repair Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedRepairType}
                  onValueChange={setSelectedRepairType}
                  style={styles.picker}
                  enabled={availableRepairTypes.length > 0}
                >
                  <Picker.Item label="Select repair type..." value="" />
                  {availableRepairTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Severity Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Severity *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={severity}
                  onValueChange={setSeverity}
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="Critical" value="critical" />
                </Picker>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => {
                  // Scroll to description field when focused
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 400, animated: true });
                  }, 200);
                }}
                blurOnSubmit={true}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus additional info field when done with description
                  additionalInfoRef.current?.focus();
                }}
              />
            </View>

            {/* Additional Information */}
            <View style={styles.section}>
              <Text style={styles.label}>Additional Information</Text>
              <Text style={styles.helperText}>
                Optional: Tools needed, affected areas, special considerations, etc.
              </Text>
              <TextInput
                ref={additionalInfoRef}
                style={styles.textArea}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Any additional details, tools needed, affected areas..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={handleAdditionalInfoFocus}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>
            
            {/* Add some bottom padding to ensure the field is visible above keyboard */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Increased padding for keyboard
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 200, // Increased padding to ensure field is visible above keyboard
  },
});