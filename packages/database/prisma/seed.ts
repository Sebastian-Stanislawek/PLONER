import { PrismaClient, Species, Gender, AnimalStatus, DocumentType, DocumentStatus, SyncStatus, SyncDirection } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rozpoczynam seedowanie bazy danych...\n');

  // 1. Utwórz testowego użytkownika
  const passwordHash = await bcrypt.hash('test123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@ploner.pl' },
    update: {},
    create: {
      email: 'test@ploner.pl',
      passwordHash,
    },
  });
  console.log('✅ Użytkownik testowy:', user.email);

  // 2. Utwórz testowe gospodarstwo
  const farm = await prisma.farm.upsert({
    where: { producerNumber: 'PL123456789' },
    update: {},
    create: {
      userId: user.id,
      name: 'Gospodarstwo Rolne Kowalski',
      producerNumber: 'PL123456789',
      herdNumber: '12345678',
      address: 'ul. Wiejska 15, 00-100 Przykładowo',
      syncStatus: SyncStatus.COMPLETED,
      lastSyncAt: new Date(),
    },
  });
  console.log('✅ Gospodarstwo:', farm.name);

  // 3. Utwórz testowe zwierzęta
  const animalsData = [
    // Bydło
    { earTagNumber: 'PL123456789001', species: Species.CATTLE, gender: Gender.FEMALE, breed: 'Holsztyńsko-Fryzyjska', birthDate: new Date('2020-03-15') },
    { earTagNumber: 'PL123456789002', species: Species.CATTLE, gender: Gender.FEMALE, breed: 'Holsztyńsko-Fryzyjska', birthDate: new Date('2021-06-20') },
    { earTagNumber: 'PL123456789003', species: Species.CATTLE, gender: Gender.MALE, breed: 'Limousine', birthDate: new Date('2022-01-10') },
    { earTagNumber: 'PL123456789004', species: Species.CATTLE, gender: Gender.FEMALE, breed: 'Simental', birthDate: new Date('2019-08-05') },
    { earTagNumber: 'PL123456789005', species: Species.CATTLE, gender: Gender.FEMALE, breed: 'Polska Czerwona', birthDate: new Date('2023-02-28') },
    { earTagNumber: 'PL123456789006', species: Species.CATTLE, gender: Gender.MALE, breed: 'Charolaise', birthDate: new Date('2023-11-15'), status: AnimalStatus.DECEASED },
    
    // Owce
    { earTagNumber: 'PL987654321001', species: Species.SHEEP, gender: Gender.FEMALE, breed: 'Merynos Polski', birthDate: new Date('2022-04-10') },
    { earTagNumber: 'PL987654321002', species: Species.SHEEP, gender: Gender.FEMALE, breed: 'Merynos Polski', birthDate: new Date('2022-04-12') },
    { earTagNumber: 'PL987654321003', species: Species.SHEEP, gender: Gender.MALE, breed: 'Suffolk', birthDate: new Date('2021-03-20') },
    
    // Kozy
    { earTagNumber: 'PL555666777001', species: Species.GOAT, gender: Gender.FEMALE, breed: 'Biała Uszlachetniona', birthDate: new Date('2021-05-15') },
    { earTagNumber: 'PL555666777002', species: Species.GOAT, gender: Gender.FEMALE, breed: 'Saaneńska', birthDate: new Date('2022-06-20') },
    
    // Świnie
    { earTagNumber: 'PL111222333001', species: Species.PIG, gender: Gender.FEMALE, breed: 'Wielka Biała Polska', birthDate: new Date('2023-01-10') },
    { earTagNumber: 'PL111222333002', species: Species.PIG, gender: Gender.MALE, breed: 'Duroc', birthDate: new Date('2023-03-15') },
    { earTagNumber: 'PL111222333003', species: Species.PIG, gender: Gender.FEMALE, breed: 'Pietrain', birthDate: new Date('2023-05-20') },
    
    // Koniowate
    { earTagNumber: 'PL444555666001', species: Species.HORSE, gender: Gender.MALE, breed: 'Konik Polski', birthDate: new Date('2018-04-20') },
    { earTagNumber: 'PL444555666002', species: Species.HORSE, gender: Gender.FEMALE, breed: 'Wielkopolski', birthDate: new Date('2019-06-10') },
  ];

  let createdAnimals = 0;
  for (const animalData of animalsData) {
    const { status, ...rest } = animalData as typeof animalData & { status?: AnimalStatus };
    
    await prisma.animal.upsert({
      where: { 
        farmId_earTagNumber: { 
          farmId: farm.id, 
          earTagNumber: rest.earTagNumber 
        } 
      },
      update: {},
      create: {
        farmId: farm.id,
        ...rest,
        status: status || AnimalStatus.ACTIVE,
        syncedAt: new Date(),
      },
    });
    createdAnimals++;
  }
  console.log(`✅ Zwierzęta: ${createdAnimals} sztuk`);

  // 4. Utwórz przykładowe dokumenty
  const deadAnimal = await prisma.animal.findFirst({
    where: { status: AnimalStatus.DECEASED, farmId: farm.id },
  });

  if (deadAnimal) {
    const existingDoc = await prisma.document.findFirst({
      where: { animalId: deadAnimal.id, type: DocumentType.DEATH_REPORT }
    });
    
    if (!existingDoc) {
      await prisma.document.create({
        data: {
          farmId: farm.id,
          animalId: deadAnimal.id,
          type: DocumentType.DEATH_REPORT,
          status: DocumentStatus.SUBMITTED,
          formData: {
            earTagNumber: deadAnimal.earTagNumber,
            species: deadAnimal.species,
            breed: deadAnimal.breed,
            deathDate: '2024-12-20',
            deathCause: 'DISEASE',
            deathPlace: 'Na terenie gospodarstwa',
            disposalMethod: 'RENDERING_PLANT',
            producerNumber: farm.producerNumber,
            herdNumber: farm.herdNumber,
          },
          irzDocNumber: 'IRZ/2024/12345',
          submittedAt: new Date('2024-12-21'),
        },
      });
      console.log('✅ Przykładowy dokument padnięcia');
    }
  }

  // 5. Utwórz logi synchronizacji
  const existingSync = await prisma.syncLog.findFirst({
    where: { farmId: farm.id }
  });
  
  if (!existingSync) {
    await prisma.syncLog.create({
      data: {
        farmId: farm.id,
        direction: SyncDirection.PULL,
        status: SyncStatus.COMPLETED,
        entitiesSynced: animalsData.length,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3500000),
      },
    });
    console.log('✅ Log synchronizacji');
  }

  // 6. Podsumowanie
  const stats = {
    animals: await prisma.animal.count({ where: { farmId: farm.id } }),
    activeAnimals: await prisma.animal.count({ where: { farmId: farm.id, status: AnimalStatus.ACTIVE } }),
    documents: await prisma.document.count({ where: { farmId: farm.id } }),
  };

  console.log('\n📊 Podsumowanie:');
  console.log(`   Zwierzęta ogółem: ${stats.animals}`);
  console.log(`   Zwierzęta aktywne: ${stats.activeAnimals}`);
  console.log(`   Dokumenty: ${stats.documents}`);
  
  console.log('\n🔐 Dane logowania:');
  console.log('   Email: test@ploner.pl');
  console.log('   Hasło: test123');
  
  console.log('\n✨ Seedowanie zakończone!');
}

main()
  .catch((e) => {
    console.error('❌ Błąd seedowania:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
