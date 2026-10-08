import React from 'react'
import api from '../api/axios'

export const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "IT Support",
  "Customer Success",
  "Product Management",
  "Design",
];

export const DEPARTMENTS = DEFAULT_DEPARTMENTS;

let cachedDepartments = null;
let fetchPromise = null;

export const getDepartments = async () => {
  if (cachedDepartments) return cachedDepartments;
  if (!fetchPromise) {
    fetchPromise = api
      .get("/meta/departments")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          cachedDepartments = res.data;
        } else {
          cachedDepartments = DEFAULT_DEPARTMENTS;
        }
        return cachedDepartments;
      })
      .catch((err) => {
        console.error("Failed to fetch departments:", err);
        return DEFAULT_DEPARTMENTS;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
};

export const useDepartments = () => {
  const [departments, setDepartments] = React.useState(cachedDepartments || DEFAULT_DEPARTMENTS);

  React.useEffect(() => {
    let active = true;
    getDepartments().then((deps) => {
      if (active) setDepartments(deps);
    });
    return () => {
      active = false;
    };
  }, []);

  return departments;
};
