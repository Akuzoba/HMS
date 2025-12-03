import prisma from '../../core/database/prisma.js';

export class VitalRepository {
  async create(data) {
    const { visitId, recordedBy, ...vitalData } = data;
    
    // Map frontend field names to Prisma schema field names
    const mappedData = {
      temperature: vitalData.temperature,
      bloodPressureSys: vitalData.bloodPressureSystolic,
      bloodPressureDia: vitalData.bloodPressureDiastolic,
      pulseRate: vitalData.heartRate,
      respiratoryRate: vitalData.respiratoryRate,
      oxygenSaturation: vitalData.oxygenSaturation,
      weight: vitalData.weight,
      height: vitalData.height,
      bmi: vitalData.bmi ? parseFloat(vitalData.bmi) : null,
      notes: vitalData.notes,
    };

    // Remove undefined values
    Object.keys(mappedData).forEach(key => {
      if (mappedData[key] === undefined) {
        delete mappedData[key];
      }
    });
    
    return prisma.vital.create({
      data: {
        ...mappedData,
        visitId,
        recordedBy,
        recordedAt: new Date(),
      },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  async findById(id) {
    const vital = await prisma.vital.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
      },
    });
    
    return vital ? this.mapVitalToFrontend(vital) : null;
  }

  async findByVisitId(visitId) {
    const vitals = await prisma.vital.findMany({
      where: { visitId },
      orderBy: { recordedAt: 'desc' },
    });
    
    return vitals.map(v => this.mapVitalToFrontend(v));
  }

  async update(id, data) {
    // Map frontend field names to Prisma schema field names
    const mappedData = {};
    if (data.bloodPressureSystolic !== undefined) mappedData.bloodPressureSys = data.bloodPressureSystolic;
    if (data.bloodPressureDiastolic !== undefined) mappedData.bloodPressureDia = data.bloodPressureDiastolic;
    if (data.heartRate !== undefined) mappedData.pulseRate = data.heartRate;
    if (data.temperature !== undefined) mappedData.temperature = data.temperature;
    if (data.respiratoryRate !== undefined) mappedData.respiratoryRate = data.respiratoryRate;
    if (data.oxygenSaturation !== undefined) mappedData.oxygenSaturation = data.oxygenSaturation;
    if (data.weight !== undefined) mappedData.weight = data.weight;
    if (data.height !== undefined) mappedData.height = data.height;
    if (data.bmi !== undefined) mappedData.bmi = parseFloat(data.bmi);
    if (data.notes !== undefined) mappedData.notes = data.notes;

    const vital = await prisma.vital.update({
      where: { id },
      data: mappedData,
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
      },
    });
    
    return this.mapVitalToFrontend(vital);
  }

  async delete(id) {
    return prisma.vital.delete({
      where: { id },
    });
  }

  // Helper method to map Prisma field names to frontend field names
  mapVitalToFrontend(vital) {
    if (!vital) return null;
    return {
      ...vital,
      bloodPressureSystolic: vital.bloodPressureSys,
      bloodPressureDiastolic: vital.bloodPressureDia,
      heartRate: vital.pulseRate,
      // Keep original fields too for compatibility
    };
  }
}
