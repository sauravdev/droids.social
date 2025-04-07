import { useState, useEffect } from 'react';
import { getContentPlans, saveContentPlan, updateContentPlan } from '../lib/api';
import type { ContentPlan } from '../lib/types';

export function useContentPlan() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await getContentPlans();
      setPlans(data);
      console.log('plans = ' , plans ) ; 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPlan(plan: Omit<ContentPlan, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const created = await saveContentPlan(plan);
      setPlans([...plans, created]);
      return created;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function updatePlan(planId: string, updates: Partial<Omit<ContentPlan, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const updated = await updateContentPlan(planId, updates);
      setPlans(plans.map(plan => plan.id === planId ? updated : plan));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }
  return { plans, loading, error, createPlan, updatePlan, refreshPlans: loadPlans };
}