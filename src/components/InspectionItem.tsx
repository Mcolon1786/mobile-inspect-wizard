import React, { useState } from "react";
import { Control, useController } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileImage, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectionItemProps {
  label: string;
  name: string;
  control: Control<any>;
}

const statusOptions = [
  { value: "ok", label: "OK", color: "text-green-600" },
  { value: "clean", label: "Clean", color: "text-blue-600" },
  { value: "not_clean", label: "Not Clean", color: "text-orange-600" },
  { value: "damaged", label: "Damaged", color: "text-red-600" },
  { value: "not_working", label: "Not Working", color: "text-red-700" },
  { value: "replenish", label: "Replenish", color: "text-yellow-600" },
  { value: "other", label: "Other", color: "text-gray-600" },
  { value: "na", label: "N/A", color: "text-gray-500" },
];

export const InspectionItem: React.FC<InspectionItemProps> = ({ label, name, control }) => {
  const [showComments, setShowComments] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const statusController = useController({
    name: `${name}.status`,
    control,
    defaultValue: "",
  });

  const photoController = useController({
    name: `${name}.photo`,
    control,
  });

  const commentsController = useController({
    name: `${name}.comments`,
    control,
    defaultValue: "",
  });

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      photoController.field.onChange(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    photoController.field.onChange(null);
    setPhotoPreview(null);
  };

  const selectedOption = statusOptions.find(opt => opt.value === statusController.field.value);

  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">{label}</h3>
          <div className="flex items-center gap-2">
            {selectedOption && (
              <div className={cn("text-sm font-medium px-2 py-1 rounded", selectedOption.color, "bg-muted")}>
                {selectedOption.label}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {/* Status Dropdown */}
          <div>
            <Select
              value={statusController.field.value}
              onValueChange={statusController.field.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Photo Upload/Display */}
          <div className="space-y-2">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Inspection photo"
                  className="w-full h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </span>
                  </Button>
                </label>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <span>
                      <FileImage className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Comments Toggle and Field */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showComments ? "Hide Comments" : "Add Comments"}
            </Button>
            
            {showComments && (
              <Textarea
                placeholder="Add notes or comments..."
                value={commentsController.field.value}
                onChange={commentsController.field.onChange}
                className="min-h-[80px]"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};