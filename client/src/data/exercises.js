export const EXERCISE_LIBRARY = [
  // Chest
  { id: "bench_press", name: "Bench Press", muscle: "Chest", equipment: "Barbell" },
  { id: "incline_bench", name: "Incline Bench Press", muscle: "Chest", equipment: "Barbell" },
  { id: "dumbbell_fly", name: "Dumbbell Fly", muscle: "Chest", equipment: "Dumbbell" },
  { id: "chest_press", name: "Chest Press Machine", muscle: "Chest", equipment: "Machine" },
  { id: "push_ups", name: "Push Ups", muscle: "Chest", equipment: "Bodyweight" },

  // Back
  { id: "deadlift", name: "Deadlift", muscle: "Back", equipment: "Barbell" },
  { id: "barbell_row", name: "Barbell Row", muscle: "Back", equipment: "Barbell" },
  { id: "lat_pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable" },
  { id: "pull_ups", name: "Pull Ups", muscle: "Back", equipment: "Bodyweight" },
  { id: "seated_row", name: "Seated Cable Row", muscle: "Back", equipment: "Cable" },

  // Shoulders
  { id: "overhead_press", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell" },
  { id: "lateral_raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { id: "front_raise", name: "Front Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { id: "face_pull", name: "Face Pull", muscle: "Shoulders", equipment: "Cable" },

  // Arms
  { id: "bicep_curl", name: "Bicep Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { id: "hammer_curl", name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { id: "tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", equipment: "Cable" },
  { id: "skull_crusher", name: "Skull Crusher", muscle: "Triceps", equipment: "Barbell" },

  // Legs
  { id: "squat", name: "Squat", muscle: "Legs", equipment: "Barbell" },
  { id: "leg_press", name: "Leg Press", muscle: "Legs", equipment: "Machine" },
  { id: "leg_curl", name: "Leg Curl", muscle: "Legs", equipment: "Machine" },
  { id: "leg_extension", name: "Leg Extension", muscle: "Legs", equipment: "Machine" },
  { id: "calf_raise", name: "Calf Raise", muscle: "Legs", equipment: "Machine" },
  { id: "lunges", name: "Lunges", muscle: "Legs", equipment: "Dumbbell" },

  // Core
  { id: "plank", name: "Plank", muscle: "Core", equipment: "Bodyweight" },
  { id: "crunches", name: "Crunches", muscle: "Core", equipment: "Bodyweight" },
  { id: "russian_twist", name: "Russian Twist", muscle: "Core", equipment: "Bodyweight" },

  // Cardio
  { id: "treadmill", name: "Treadmill", muscle: "Cardio", equipment: "Machine" },
  { id: "cycling", name: "Cycling", muscle: "Cardio", equipment: "Machine" },
  { id: "jump_rope", name: "Jump Rope", muscle: "Cardio", equipment: "Equipment" },
];

export const MUSCLE_GROUPS = [...new Set(EXERCISE_LIBRARY.map(e => e.muscle))];
