import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from './axiosInstance'

/* ================= AUTH ================= */

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials) =>
      axiosInstance.post('/auth/login', credentials),
    onSuccess: (data) => {
      localStorage.setItem('token', data.data.token)
    },
  })
}

export const useSignup = () => {
  return useMutation({
    mutationFn: (userData) =>
      axiosInstance.post('/auth/register', userData),
    onSuccess: (data) => {
      localStorage.setItem('token', data.data.token)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => axiosInstance.post('/auth/logout'),
    onSuccess: () => {
      localStorage.removeItem('token')
      queryClient.clear()
    },
  })
}

/* ================= JOBS ================= */

export const useJobs = (filters = {}) => {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () =>
      axiosInstance
        .get('/jobs', { params: filters })
        .then((res) => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useJobById = (jobId) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () =>
      axiosInstance.get(`/jobs/${jobId}`).then((res) => res.data),
    enabled: !!jobId,
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobData) =>
      axiosInstance.post('/jobs', jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
    },
  })
}

export const useExtractJobFromLink = () => {
  return useMutation({
    mutationFn: (jobLink) =>
      axiosInstance.post('/jobs/extract-from-link', { jobLink }),
  })
}

export const useLocationSuggestions = (q) => {
  return useQuery({
    queryKey: ['location-suggestions', q],
    queryFn: () =>
      axiosInstance
        .get('/jobs/locations/suggest', { params: { q } })
        .then((res) => res.data?.data || []),
    enabled: Boolean(q && q.trim().length >= 2),
    staleTime: 1000 * 60 * 10,
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, data }) =>
      axiosInstance.put(`/jobs/${jobId}`, data),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
    },
  })
}

export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId) =>
      axiosInstance.delete(`/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
    },
  })
}

export const useApplyToJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId) =>
      axiosInstance.post(`/jobs/${jobId}/apply`),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
    },
  })
}

/* ================= AI ================= */

export const useAIAnalyze = () => {
  return useMutation({
    mutationFn: (data) =>
      axiosInstance.post('/ai/match-score', data, {
        timeout: 120000,
      }),
  })
}

export const useAIAnalyzeUpload = () => {
  return useMutation({
    mutationFn: (formData) =>
      axiosInstance.post('/ai/match-score/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      }),
  })
}

/* ================= STATS ================= */

export const useJobStats = () => {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: () =>
      axiosInstance.get('/jobs/stats').then((res) => res.data),
    staleTime: 1000 * 60 * 2,
  })
}
