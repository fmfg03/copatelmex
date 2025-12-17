import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a signed URL for a file in the registration-documents bucket.
 * Use this function to display files from the private storage bucket.
 * 
 * @param filePath - The path to the file in the bucket
 * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour)
 * @returns The signed URL or null if there was an error
 */
export async function getSignedUrl(
  filePath: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;
  
  // If it's already a full URL (legacy data), return it as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('registration-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * Generates signed URLs for multiple files.
 * 
 * @param filePaths - Array of file paths in the bucket
 * @param expiresIn - Time in seconds until the URLs expire (default: 3600 = 1 hour)
 * @returns Object mapping file paths to signed URLs
 */
export async function getSignedUrls(
  filePaths: (string | null | undefined)[],
  expiresIn: number = 3600
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  
  const validPaths = filePaths.filter((path): path is string => 
    Boolean(path) && !path.startsWith('http://') && !path.startsWith('https://')
  );

  if (validPaths.length === 0) {
    // Handle legacy URLs
    filePaths.forEach(path => {
      if (path?.startsWith('http://') || path?.startsWith('https://')) {
        results[path] = path;
      }
    });
    return results;
  }

  try {
    const { data, error } = await supabase.storage
      .from('registration-documents')
      .createSignedUrls(validPaths, expiresIn);

    if (error) {
      console.error('Error creating signed URLs:', error);
      return results;
    }

    data.forEach(item => {
      if (item.path) {
        results[item.path] = item.signedUrl;
      }
    });

    // Handle legacy URLs
    filePaths.forEach(path => {
      if (path?.startsWith('http://') || path?.startsWith('https://')) {
        results[path] = path;
      }
    });

    return results;
  } catch (error) {
    console.error('Error in getSignedUrls:', error);
    return results;
  }
}
