import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { IssueStatus, IssueType, SafetyRisk } from '../types/report';

export async function seedCivicCases() {
  const seedCases = [
    {
      title: 'Large Pothole Near School Crosswalk',
      description: 'A deep pothole has formed right before the pedestrian crosswalk near the elementary school, posing a serious risk to vehicles and children crossing.',
      issueType: 'pothole' as IssueType,
      address: '124 School Lane, Downtown',
      lat: 37.7749,
      lng: -122.4194,
      status: 'reported' as IssueStatus,
      evidenceScore: 85,
      priorityScore: 75,
      safetyRisk: 'high' as SafetyRisk,
      department: 'transportation',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
      aiSummary: 'Analysis indicates a deep pothole in a high-traffic zone (near a crosswalk), posing a risk to vehicles and pedestrians.'
    },
    {
      title: 'Illegal Dumping at Vacant Lot',
      description: 'Large pile of garbage, including broken furniture and construction debris, dumped overnight on the empty lot next to the community center.',
      issueType: 'garbage' as IssueType,
      address: '400 Community Blvd',
      lat: 37.7849,
      lng: -122.4094,
      status: 'verified' as IssueStatus,
      evidenceScore: 92,
      priorityScore: 60,
      safetyRisk: 'medium' as SafetyRisk,
      department: 'sanitation',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80',
      aiSummary: 'Image shows a large accumulation of mixed waste and debris. Verified as illegal dumping requiring sanitation department intervention.'
    },
    {
      title: 'Streetlight Out at Major Intersection',
      description: 'The main overhead streetlight at the intersection is completely out, making the area very dark and dangerous for nighttime driving.',
      issueType: 'streetlight' as IssueType,
      address: 'Intersection of 5th and Main',
      lat: 37.7649,
      lng: -122.4294,
      status: 'in_progress' as IssueStatus,
      evidenceScore: 70,
      priorityScore: 65,
      safetyRisk: 'medium' as SafetyRisk,
      department: 'power',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80',
      aiSummary: 'Report of a non-functioning streetlight at a key intersection. Reduced visibility poses a moderate safety risk.'
    },
    {
      title: 'Water Main Leak Flooding Road',
      description: 'Clean water is gushing out of a crack in the pavement and flooding the right lane of the road. Seems like a broken pipe.',
      issueType: 'water_leakage' as IssueType,
      address: '880 Waterway Ave',
      lat: 37.7549,
      lng: -122.4194,
      status: 'assigned' as IssueStatus,
      evidenceScore: 95,
      priorityScore: 88,
      safetyRisk: 'critical' as SafetyRisk,
      department: 'water',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1542360663-8f40838b8d7a?auto=format&fit=crop&q=80',
      aiSummary: 'Clear evidence of a significant water leak from the pavement. High flow rate indicates a potential main break requiring immediate dispatch.'
    },
    {
      title: 'Clogged Storm Drain Overflowing',
      description: 'The storm drain is completely blocked with leaves and trash, causing water to pool deeply during the rain.',
      issueType: 'drainage' as IssueType,
      address: '12 Flood St, Northside',
      lat: 37.7949,
      lng: -122.3994,
      status: 'reported' as IssueStatus,
      evidenceScore: 80,
      priorityScore: 55,
      safetyRisk: 'low' as SafetyRisk,
      department: 'sanitation',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1584483758254-20bba83bd2b1?auto=format&fit=crop&q=80',
      aiSummary: 'Blocked drainage grate causing localized water pooling. Risk is low but requires clearing to prevent larger flooding issues.'
    },
    {
      title: 'Traffic Signal Facing Wrong Way',
      description: 'The traffic light head has been twisted by the wind and is now facing the wrong direction, confusing drivers.',
      issueType: 'other' as IssueType,
      address: 'Busy Rd & Market St',
      lat: 37.7849,
      lng: -122.4194,
      status: 'escalated' as IssueStatus,
      evidenceScore: 88,
      priorityScore: 90,
      safetyRisk: 'critical' as SafetyRisk,
      department: 'transportation',
      isSeedData: true,
      imageUrl: 'https://images.unsplash.com/photo-1554625299-d4196c738eeb?auto=format&fit=crop&q=80',
      aiSummary: 'Misaligned traffic signal observed. This creates immediate confusion at the intersection and poses a critical risk of collision.'
    }
  ];

  try {
    const batch = writeBatch(db);
    
    for (const caseData of seedCases) {
      const reportRef = doc(collection(db, 'reports'));
      
      batch.set(reportRef, {
        ...caseData,
        userId: 'admin-seed',
        userEmail: 'seed@civiclens.local',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        validationCount: Math.floor(Math.random() * 10),
      });

      const timelineRef = doc(collection(db, 'timeline'));
      batch.set(timelineRef, {
        reportId: reportRef.id,
        title: 'Report Submitted',
        description: 'Civic case generated by community member.',
        type: 'citizen_action',
        createdAt: serverTimestamp()
      });
      
      const aiTimelineRef = doc(collection(db, 'timeline'));
      batch.set(aiTimelineRef, {
        reportId: reportRef.id,
        title: 'Civic Intelligence Analysis',
        description: 'Case prioritized and categorized automatically.',
        type: 'ai_analysis',
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding cases:', error);
    throw error;
  }
}
