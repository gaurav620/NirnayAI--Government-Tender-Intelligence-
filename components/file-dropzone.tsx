"use client";

import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  title,
  description,
  files,
  multiple,
  accept,
  onFilesChange,
}: {
  title: string;
  description: string;
  files: File[];
  multiple?: boolean;
  accept: string;
  onFilesChange: (files: File[]) => void;
}) {
  return (
    <label className="group block cursor-pointer rounded-[1.25rem] border-2 border-dashed border-slate-200 bg-white/70 p-7 shadow-soft transition-all duration-300 ease-smooth hover:border-blue-300 hover:bg-white hover:shadow-government">
      <input
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={accept}
        onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
      />
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-soft transition-all duration-300 ease-smooth group-hover:scale-110 group-hover:shadow-government">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">{description}</p>
      </div>
      {files.length > 0 ? (
        <div className="mt-5 space-y-2">
          {files.map((file) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-sm shadow-soft">
              <span className="truncate font-semibold text-slate-700">{file.name}</span>
              <button
                type="button"
                className={cn("ml-3 rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500")}
                onClick={(event) => {
                  event.preventDefault();
                  onFilesChange(files.filter((item) => item !== file));
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </label>
  );
}
