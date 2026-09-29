import Heading from '@/components/heading'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import React from 'react'

const UserIndex = () => {
  return (
    <div className='p-8'>
        <div className='flex justify-between w-full '>
        <Heading title='User Management' description='Manage user from here' />
        <Button className='cursor-pointer'> <Plus size={12} /> Create </Button>
        </div>
    </div>
  )
}

export default UserIndex