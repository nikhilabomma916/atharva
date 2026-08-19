import { Grievance } from '@/lib/types';

// Simple TF-IDF implementation for text similarity without ML
function getTerms(text: string): string[] {
  return text.toLowerCase().match(/\b\w+\b/g) || [];
}

function computeSimilarity(text1: string, text2: string): number {
  const terms1 = getTerms(text1);
  const terms2 = getTerms(text2);
  
  const uniqueTerms = Array.from(new Set([...terms1, ...terms2]));
  
  const vec1 = uniqueTerms.map(t => terms1.filter(term => term === t).length);
  const vec2 = uniqueTerms.map(t => terms2.filter(term => term === t).length);
  
  const dotProduct = vec1.reduce((sum, v1, i) => sum + v1 * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

export function findSimilarGrievances(grievance: Grievance, allGrievances: Grievance[], threshold: number = 0.7): { grievanceId: string; similarity: number }[] {
  const results: { grievanceId: string; similarity: number }[] = [];
  const sourceText = `${grievance.title} ${grievance.description}`;
  
  for (const other of allGrievances) {
    if (other.id === grievance.id) continue;
    
    const otherText = `${other.title} ${other.description}`;
    let sim = computeSimilarity(sourceText, otherText);
    
    // Factor in location proximity and category match
    if ((grievance.categoryId || grievance.category) === (other.categoryId || other.category)) {
      sim += 0.1;
    }
    
    if (grievance.location?.ward && other.location?.ward && grievance.location.ward === other.location.ward) {
      sim += 0.1;
    }
    
    sim = Math.min(1.0, sim);
    
    if (sim >= threshold) {
      results.push({ grievanceId: other.id, similarity: sim });
    }
  }
  
  return results.sort((a, b) => b.similarity - a.similarity);
}
